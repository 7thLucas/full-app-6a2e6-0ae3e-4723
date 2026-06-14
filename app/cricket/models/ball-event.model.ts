import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import type { ExtraType, DismissalType } from "../types";

class DismissalInfo {
  @prop({ required: false, type: String })
  type!: DismissalType;

  @prop({ required: false, type: String })
  batsmanId!: string | null;

  @prop({ required: false, type: String })
  bowlerId!: string | null;

  @prop({ required: false, type: String })
  fielderId!: string | null;
}

@modelOptions({ schemaOptions: { collection: "cricket_ball_events", timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export class CricketBallEvent extends TimeStamps {
  @prop({ required: true, type: String })
  matchId!: string;

  @prop({ required: true, type: Number, enum: [1, 2] })
  inning!: 1 | 2;

  @prop({ required: true, type: Number })
  overNumber!: number;

  @prop({ required: true, type: Number })
  ballNumber!: number;

  @prop({ required: true, type: Number })
  globalBallIndex!: number;

  @prop({ required: true, type: String })
  batsmanId!: string;

  @prop({ required: true, type: String })
  nonStrikerId!: string;

  @prop({ required: true, type: String })
  bowlerId!: string;

  @prop({ required: true, type: Number, default: 0 })
  runs!: number;

  @prop({ required: false, type: String, default: null })
  extraType!: ExtraType;

  @prop({ required: true, type: Number, default: 0 })
  extraRuns!: number;

  @prop({ required: true, type: Boolean, default: true })
  isLegalDelivery!: boolean;

  @prop({ required: false, type: DismissalInfo, _id: false, default: null })
  dismissal!: DismissalInfo | null;
}

export const CricketBallEventModel = getModelForClass(CricketBallEvent);
