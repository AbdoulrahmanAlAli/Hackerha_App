import mongoose from "mongoose";
import { Notification } from "../models/notification.model";
import {
  createNotificationSchema,
  updateNotificationSchema,
} from "../schemas/notification.schema";
import {
  badRequest,
  notFound,
  forbidden,
} from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";
import { Student } from "../../users/student/models/student.model";
import { messaging } from "firebase-admin";
import { admin } from "../../../core/firebase/firebase-admin";
export class CtrlNotificationService {
  // ~ Post => /api/hackit/ctrl/notification
  static async createNotification(data: any) {
    let parsed: any;
    try {
      parsed = createNotificationSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const notification = await Notification.create({
      studentId: parsed.studentId ?? null,
      type: parsed.type,
      title: parsed.title,
      subtitle: parsed.subtitle,
    });

    if (parsed.studentId) {
      await this.sendPushToStudent(parsed.studentId, notification);
    } else {
      await this.sendPushToAllStudents(notification);
    }

    return { message: "تم إنشاء الإشعار بنجاح" };
  }

  // ~ Get => /api/hackit/notification/student/:studentId
  static async getNotificationsByStudentId(studentId: string) {
    if (!mongoose.isValidObjectId(studentId))
      throw badRequest("معرف الطالب غير صالح");

    const student = await Student.findById(studentId).select("_id");
    if (!student) throw notFound("الطالب غير موجود");

    const notifications = await Notification.find({
      $or: [{ studentId }, { studentId: null }],
    })
      .sort({ createdAt: -1 })
      .populate("student", "userName profilePhoto")
      .lean();

    return notifications;
  }

  // ~ Get => /api/hackit/ctrl/notification/:id
  static async getNotificationById(notificationId: string) {
    if (!mongoose.isValidObjectId(notificationId))
      throw badRequest("معرف الإشعار غير صالح");

    const notification = await Notification.findById(notificationId)
      .populate("student", "userName profilePhoto")
      .lean();

    if (!notification) throw notFound("الإشعار غير موجود");

    return notification;
  }

  // ~ Get => /api/hackit/ctrl/notification
  static async getAllNotifications() {
    return Notification.find()
      .sort({ createdAt: -1 })
      .populate("student", "userName profilePhoto email")
      .lean();
  }

  // ~ Put => /api/hackit/ctrl/notification/:id
  static async updateNotification(notificationId: string, data: any) {
    if (!mongoose.isValidObjectId(notificationId))
      throw badRequest("معرف الإشعار غير صالح");

    let parsed: any;
    try {
      parsed = updateNotificationSchema.parse(data);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) throw notFound("الإشعار غير موجود");

    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      parsed,
      { new: true, runValidators: true }
    );

    if (!updated) throw notFound("فشل تحديث الإشعار");

    return { message: "تم تحديث الإشعار بنجاح" };
  }

  // ~ Delete => /api/hackit/ctrl/notification/:id
  static async deleteNotification(notificationId: string, studentId?: string) {
    if (!mongoose.isValidObjectId(notificationId))
      throw badRequest("معرف الإشعار غير صالح");

    const notification = await Notification.findById(notificationId);
    if (!notification) throw notFound("الإشعار غير موجود");

    if (
      notification.studentId &&
      studentId &&
      notification.studentId.toString() !== studentId
    ) {
      throw forbidden("غير مسموح لك بحذف هذا الإشعار");
    }

    await Notification.findByIdAndDelete(notificationId);

    return { message: "تم حذف الإشعار بنجاح" };
  }

  // ===== Push Notifications =====

  private static async sendPushToStudent(studentId: string, notification: any) {
    try {
      const student = await Student.findById(studentId).select(
        "fcmToken userName"
      );
      if (!student || !student.fcmToken) return;

      const message: messaging.Message = {
        token: student.fcmToken,
        notification: {
          title: notification.title,
          body: notification.subtitle,
        },
        data: {
          type: notification.type,
          notificationId: notification._id.toString(),
          studentId,
          isPublic: "false",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: { priority: "high" },
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
      };

      await admin.messaging().send(message);
    } catch (err: any) {
      if (
        err?.code === "messaging/invalid-registration-token" ||
        err?.code === "messaging/registration-token-not-registered"
      ) {
        await Student.findByIdAndUpdate(studentId, { fcmToken: null });
      }
    }
  }

  private static async sendPushToAllStudents(notification: any) {
    const students = await Student.find({
      fcmToken: { $ne: null },
    }).select("fcmToken _id");

    if (!students.length) return;

    const batchSize = 500;

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const tokens = batch.map((s) => s.fcmToken!).filter(Boolean);

      if (!tokens.length) continue;

      const message: messaging.MulticastMessage = {
        tokens,
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
        android: { priority: "high" },
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      response.responses.forEach((r: messaging.SendResponse, idx: number) => {
        if (
          !r.success &&
          (r.error?.code === "messaging/invalid-registration-token" ||
            r.error?.code === "messaging/registration-token-not-registered")
        ) {
          Student.findByIdAndUpdate(batch[idx]._id, {
            fcmToken: null,
          }).exec();
        }
      });
    }
  }
}
