import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import type { TossResult, MatchStatus } from "../types";

class MatchTeamSetup {
  @prop({ required: true, type: String })
  teamId!: string;

  @prop({ required: true, type: String })
  teamName!: string;

  @prop({ required: true, type: String })
  teamShortName!: string;

  @prop({ required: true, type: String })
  teamColor!: string;

  @prop({ required: true, type: () => [String] })
  playingXI!: string[];

  @prop({ required: true, type: String })
  captainId!: string;

  @prop({ required: true, type: String })
  wicketkeeperId!: string;
}

@modelOptions({ schemaOptions: { collection: "cricket_matches", timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export class CricketMatch extends TimeStamps {
  @prop({ required: true, type: MatchTeamSetup, _id: false })
  teamA!: MatchTeamSetup;

  @prop({ required: true, type: MatchTeamSetup, _id: false })
  teamB!: MatchTeamSetup;

  @prop({ required: true, type: String })
  tossWonByTeamId!: string;

  @prop({ required: true, type: String, enum: ["bat", "bowl"] })
  tossDecision!: TossResult;

  @prop({ required: true, type: Number })
  totalOvers!: number;

  @prop({ required: true, type: String, enum: ["setup", "first_innings", "second_innings", "completed"], default: "first_innings" })
  status!: MatchStatus;

  @prop({ required: true, type: Number, enum: [1, 2], default: 1 })
  currentInning!: 1 | 2;
}

export const CricketMatchModel = getModelForClass(CricketMatch);
