import passport from "passport";
import passportDropbox from "passport-dropbox-oauth2";
import { Request } from "express";

import { dropboxConfig } from "@config/dropboxConfig";
import { getStrObjectId } from "@classes/model.class";
import User from "@classes/user.class";
import { UserSchema } from "@schemas/user.schema";
import AuthController from "@controllers/AuthController";
import OAuthProvider from "@models/oAuthProvider.enum";
import { decodeJwt } from "../middlewares/checkJwt";
import { OAuthState } from "routes/authRoutes";

const DropboxStrategy = passportDropbox.Strategy;

async function successfullyAuthentificated(req: Request, accessToken: string, refreshToken: string, profile: Profile, done?: (err?: Error | null, user?: User, info?: object) => void): Promise<User | undefined> {
    const userSchema = new UserSchema();

    try {
        const state: OAuthState = JSON.parse(typeof req.query.state === "string" ? req.query.state : "{}");
        if (state.token)
            req.user = decodeJwt(state.token);

        const userId: string | undefined = req.user?.data.user_id;
        let providerUser = await userSchema.findByOAuthProviderId(OAuthProvider.DROPBOX, profile.id);

        if (userId) {
            if (providerUser && userId !== getStrObjectId(providerUser))
                throw "Service user already connected to another user";
            const user: User = await userSchema.get(userId);

            if (!user.oauth)
                user.oauth = {};
            user.oauth.dropbox = {
                id: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken
            };
            const userEdited = await userSchema.edit(user);
            if (done)
                done(null, userEdited);
            return userEdited;
        }

        if (!providerUser && (profile._json.email || profile.username || profile.displayName || profile.id))
            providerUser = await userSchema.findByUsername(profile._json.email || profile.username || profile.displayName || profile.id);

        if (providerUser) {
            providerUser.token = AuthController.signToken({
                user_id: getStrObjectId(providerUser)
            });

            if (!providerUser.oauth)
                providerUser.oauth = {};
            providerUser.oauth.dropbox = {
                id: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken
            };

            const user = await userSchema.edit(providerUser);
            if (done)
                done(null, user);
            return user;
        } else {

            const user = await userSchema.add(new User({
                username: profile._json.email || profile.username || profile.displayName || profile.id,
                oauth: {
                    dropbox: {
                        id: profile.id,
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    }
                }
            }));

            user.token = AuthController.signToken({
                user_id: getStrObjectId(user)
            });
            if (done)
                done(null, await userSchema.edit(user));
            return user;
        }

    } catch (error) {
        if (done)
            done(error as Error);
        return undefined;
    }
}

passport.use("dropbox", new DropboxStrategy(
    { apiVersion: "2", ...dropboxConfig, passReqToCallback: true },
    successfullyAuthentificated
));