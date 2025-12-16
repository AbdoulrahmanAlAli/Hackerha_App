import mongoose from "mongoose";
import {
  Notification,
  validateCreateNotification,
} from "../../models/notification/Notification.model";
import { Student } from "../../models/users/students/Student.model";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../middlewares/handleErrors";
import { INotification } from "../../models/notification/dtos";
import { messaging } from "firebase-admin";
import { admin } from "../../utils/firebase-admin";

class NotificationService {
  // إنشاء إشعار جديد (عام أو خاص)
  static async createNotification(data: INotification) {
    const { error } = validateCreateNotification(data);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }

    const notification = await Notification.create({
      studentId: data.studentId || null,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle,
    });

    if (data.studentId) {
      // إرسال إشعار لطالب محدد
      await this.sendPushToStudent(data.studentId.toString(), notification);
    } else {
      // إرسال إشعار عام لجميع الطلاب
      await this.sendPushToAllStudents(notification);
    }

    return notification;
  }

  // الحصول على إشعارات الطالب (الشخصية + العامة)
  static async getNotificationsByStudentId(studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new BadRequestError("معرف الطالب غير صالح");
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(studentId);
    if (!student) {
      throw new NotFoundError("الطالب غير موجود");
    }

    // البحث عن الإشعارات: إما خاصة بالطالب أو عامة (studentId = null)
    const [notifications, total] = await Promise.all([
      Notification.find({
        $or: [{ studentId: studentId }, { studentId: null }],
      })
        .sort({ createdAt: -1 })
        .populate("student")
        .lean(),
      Notification.countDocuments({
        $or: [{ studentId: studentId }, { studentId: null }],
      }),
    ]);

    return {
      notifications,
    };
  }

  // تحديث إشعار
  static async updateNotification(id: string, updateData: Partial<any>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف الإشعار غير صالح");
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      throw new NotFoundError("الإشعار غير موجود");
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("student", "userName profilePhoto");

    if (!updatedNotification) {
      throw new NotFoundError("فشل تحديث الإشعار");
    }

    return {
      message: "تم تحديث الإشعار بنجاح",
    };
  }

  // حذف إشعار
  static async deleteNotification(id: string, studentId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف الإشعار غير صالح");
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      throw new NotFoundError("الإشعار غير موجود");
    }

    // التحقق من صلاحية الطالب إذا كان الإشعار خاصاً
    if (
      notification.studentId &&
      notification.studentId.toString() !== studentId
    ) {
      throw new ForbiddenError("غير مسموح لك بحذف هذا الإشعار");
    }

    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      throw new NotFoundError("فشل حذف الإشعار");
    }

    return {
      message: "تم حذف الإشعار بنجاح",
    };
  }

  // الحصول على إشعار محدد
  static async getNotificationById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("معرف الإشعار غير صالح");
    }

    const notification = await Notification.findById(id)
      .populate("student", "userName profilePhoto")
      .lean();

    if (!notification) {
      throw new NotFoundError("الإشعار غير موجود");
    }

    return notification;
  }

  static async getAllNotifications() {
    const [notifications, total] = await Promise.all([
      Notification.find()
        .populate("student", "userName profilePhoto email")
        .sort({ createdAt: -1 })
        .lean(),
      Notification.countDocuments(),
    ]);

    return notifications;
  }

  private static async sendPushToStudent(studentId: string, notification: any) {
    try {
      const student = await Student.findById(studentId).select(
        "fcmToken userName"
      );

      if (!student) {
        console.log(`الطالب غير موجود: ${studentId}`);
        return;
      }

      if (!student.fcmToken) {
        console.log(
          `الطالب ${
            student.firstName + " " + student.lastName
          } ليس لديه رمز FCM`
        );
        return;
      }

      const message: messaging.Message = {
        token: student.fcmToken,
        notification: {
          title: notification.title,
          body: notification.subtitle,
        },
        data: {
          type: notification.type,
          notificationId: notification._id.toString(),
          studentId: studentId,
          isPublic: "false",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(
        `تم إرسال الإشعار بنجاح إلى ${
          student.firstName + " " + student.lastName
        }: ${response}`
      );
    } catch (error: any) {
      console.error(`خطأ في إرسال الإشعار إلى الطالب ${studentId}:`, error);

      // إزالة رمز FCM غير الصالح
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        await Student.findByIdAndUpdate(studentId, { fcmToken: null });
        console.log(`تم إزالة رمز FCM غير الصالح للطالب: ${studentId}`);
      }
    }
  }

  // إرسال إشعار push لجميع الطلاب
  private static async sendPushToAllStudents(notification: any) {
    try {
      // جلب جميع الطلاب الذين لديهم tokens مفعلة للإشعارات
      const students = await Student.find({
        fcmToken: { $ne: null },
      }).select("fcmToken _id userName");

      if (students.length === 0) {
        console.log("لا يوجد طلاب لديهم رمز FCM صالح للإشعار العام");
        return;
      }

      console.log(`جاري إرسال الإشعار العام إلى ${students.length} طالب`);

      const batchSize = 500;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const tokens = batch
          .map((student) => student.fcmToken!)
          .filter(Boolean);

        if (tokens.length > 0) {
          const multicastMessage: messaging.MulticastMessage = {
            tokens: tokens,
            notification: {
              title: notification.title,
              body: notification.subtitle,
            },
            data: {
              type: notification.type,
              notificationId: notification._id.toString(),
              isPublic: "true",
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            android: {
              priority: "high" as const,
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          };

          const response = await admin
            .messaging()
            .sendEachForMulticast(multicastMessage);
          totalSent += response.successCount;
          totalFailed += response.failureCount;

          response.responses.forEach(
            (fcmResponse: messaging.SendResponse, index: number) => {
              if (!fcmResponse.success) {
                console.log(
                  `فشل إرسال الإشعار العام إلى الطالب: ${
                    batch[index].firstName + " " + batch[index].lastName
                  }`,
                  fcmResponse.error
                );

                if (
                  fcmResponse.error?.code ===
                    "messaging/invalid-registration-token" ||
                  fcmResponse.error?.code ===
                    "messaging/registration-token-not-registered"
                ) {
                  Student.findByIdAndUpdate(batch[index]._id, {
                    fcmToken: null,
                  }).exec();
                }
              }
            }
          );
        }
      }

      console.log(
        `تم إرسال الإشعار العام: ${totalSent} ناجح, ${totalFailed} فاشل`
      );

      return {
        totalStudents: students.length,
        successful: totalSent,
        failed: totalFailed,
      };
    } catch (error) {
      console.error("خطأ في إرسال الإشعار العام:", error);
      throw new Error("فشل في إرسال الإشعار العام");
    }
  }
}

export { NotificationService };
