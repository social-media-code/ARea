import Model from "./model.class";
import { Parameter } from "../model/Parameters";

export enum ActionType {
    DATE = "DATE",
    DATETIME = "DATETIME",
    TWITCH_STREAM = "TWITCH_STREAM",
    TWITTER_MSG = "TWITTER_MSG",
    RSS_ENTRY = "RSS_ENTRY",
    GITHUB_ISSUE = "GITHUB_ISSUE",
    GITHUB_PULL_REQ = "GITHUB_PULL_REQ",
    DISCORD_MSG = "DISCORD_MSG",
    UNSPLASH_POST = "UNSPLASH_POST",
}

export default class Action extends Model {
    type: ActionType;
    parameters: Parameter[];

    constructor(action: Action) {
        super(action);

        this.type = action.type;
        this.parameters = action.parameters;
    }
}