import { Context, Scenes } from "telegraf";
import { EnrollWizardSession } from "./bot.types";

export type BotStep =
  | "idle"
  | "branch"
  | "year"
  | "semester"
  | "course"
  | "university_number";

export interface MySceneSessionData extends Scenes.SceneSessionData {
  currentStep?: BotStep;
  enroll?: EnrollWizardSession;
}

export interface MyContext extends Context {
  session: Scenes.SceneSession<MySceneSessionData>;
  scene: Scenes.SceneContextScene<MyContext, MySceneSessionData>;
}