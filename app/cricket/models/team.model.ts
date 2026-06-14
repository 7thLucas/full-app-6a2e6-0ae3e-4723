import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import type { PlayerRole, BattingStyle, BowlingStyle } from "../types";

@modelOptions({ schemaOptions: { collection: "cricket_players", timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export class CricketPlayer extends TimeStamps {
  @prop({ required: true, type: String })
  name!: string;

  @prop({ required: true, type: String, enum: ["Batsman", "Bowler", "All-Rounder", "Wicketkeeper"] })
  role!: PlayerRole;

  @prop({ required: true, type: String, enum: ["RHB", "LHB"], default: "RHB" })
  battingStyle!: BattingStyle;

  @prop({ required: true, type: String, enum: ["Fast", "Medium-Fast", "Medium", "Off-Spin", "Leg-Spin", "Slow Left-Arm", "None"], default: "None" })
  bowlingStyle!: BowlingStyle;

  @prop({ required: true, type: String })
  teamId!: string;
}

@modelOptions({ schemaOptions: { collection: "cricket_teams", timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export class CricketTeam extends TimeStamps {
  @prop({ required: true, type: String })
  name!: string;

  @prop({ required: true, type: String })
  shortName!: string;

  @prop({ required: true, type: String, default: "#166534" })
  color!: string;
}

export const CricketPlayerModel = getModelForClass(CricketPlayer);
export const CricketTeamModel = getModelForClass(CricketTeam);
