import { AuthenticationAccountRepository,
	AuthenticationUser,
    AuthenticationUserImpl } from 'authentication-flows-js';
import {Datastore} from '@google-cloud/datastore';
const debug = require('debug')('authentication-account-appengine');

const AUTH_ACCOUNT_INDEX: string = 'authentication-account';

const USER_TYPE = "GaeUser";
const USER_FORENAME = "forename";
const USER_SURNAME = "surname";
const USER_NICKNAME = "nickname";
const USER_EMAIL = "email";
const USER_ENABLED = "enabled";
const USER_AUTHORITIES = "authorities";

const simple_query = {
    query: {
        term: { 'token': '' }
    }
};

export class AuthenticationAccountGAERepository /*implements AuthenticationAccountRepository */{

    // Creates a client
    private datastore = new Datastore();

    constructor() {}

    protected getIndex(): string {
        return AUTH_ACCOUNT_INDEX;
    }

    async loadUserByUsername(username: string): Promise<AuthenticationUser> {

        // Records, called "entities" in Datastore, are retrieved by using a key. The
        // key is more than a numeric identifier, it is a complex data structure that
        // can be used to model relationships. The simplest key has a string `kind`
        // value, and either a numeric `id` value, or a string `name` value.
        //
        // A single record can be retrieved with {@link Datastore#key} and
        // {@link Datastore#get}.
        const key = this.datastore.key(['Company', 'Google']);
        const entity = await this.datastore.get(key);
        debug(`current num attempts: ${entity}`);

        const userJson: any = {};
        const user: AuthenticationUser = new AuthenticationUserImpl(
            userJson.email,
            userJson.encodedPassword,
            userJson.isActive,
            userJson.loginAttemptsLeft,
            userJson.passwordLastChangeDate,
            userJson.firstName,
            userJson.lastName,
            userJson.authorities,
            userJson.token,
            userJson.tokenDate
        );
        return user;
    }

    // async setEnabled(username: string) {
    //     await this.setEnabledFlag(username, true);
    // }
    //
    // async setDisabled(username: string) {
    //     await this.setEnabledFlag(username, false);
    // }

    // protected async setEnabledFlag(username: string, enabled: boolean) {
    //     await this.datastore.save(username, { isActive: enabled });
    // }

    async isEnabled(username: string): Promise<boolean> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        if (!storedUser)
            return false;
        return await storedUser.isEnabled();
    }

    //TODO: should be in abstract class
    // async decrementAttemptsLeft(username: string) {
    //     const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
    //     let attempts = storedUser.getLoginAttemptsLeft();
    //     debug(`current num attempts: ${attempts}`);
    //     await this.setAttemptsLeft(username, --attempts);
    // }

    // async setAttemptsLeft(username: string, loginAttemptsLeft: number) {
    //     await this.updateItem(username, { loginAttemptsLeft: loginAttemptsLeft });
    // }
    //
    // async setPassword(username: string, newPassword: string) {
    //     await this.updateItem(username, {
    //         encodedPassword: newPassword,
    //         token: null,
    //         tokenDate: null
    //     });
    // }

    //TODO: should be in abstract class, async/await
    async getEncodedPassword(username: string): Promise<string> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        if (!storedUser)
            return null;
        return storedUser.getPassword();
    }

    async getPasswordLastChangeDate(username: string): Promise<Date> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        return storedUser.getPasswordLastChangeDate();
    }

    setAuthority(username: string, authority: string) {
        throw new Error("Method not implemented.");
    }

    // async createUser(authenticationUser: AuthenticationUser): Promise<void> {
    //     debug('createUser / elasticsearch implementation!');
    //
    //     const newUser: AuthenticationUser = new AuthenticationUserImpl(authenticationUser.getUsername(),
    //         authenticationUser.getPassword(),
    //         false,
    //         authenticationUser.getLoginAttemptsLeft(),
    //         new Date(),
    //         authenticationUser.getFirstName(),
    //         authenticationUser.getLastName(),
    //         authenticationUser.getAuthorities(),
    //         authenticationUser.getToken(),
    //         authenticationUser.getTokenDate());
    //
    //     if( await this.userExists( newUser.getUsername() ) ) {
    //         //ALREADY_EXIST:
    //         throw new Error(`user ${newUser.getUsername()} already exists`);
    //     }
    //
    //     await this.indexItem(newUser.getUsername(), newUser);
    // }

    // async deleteUser(username: string): Promise<void> {
    //     await this.deleteItem(username);
    // }

    // async userExists(username: string): Promise<boolean> {
    //     debug('userExists?');
    //     return await this.exists(username);
    // }
    //
    // async addLink(username: string, link: string) {
    //     await this.updateItem(username, {
    //         token: link,
    //         tokenDate: new Date()
    //     });
    // }
    //
    // /**
    //  * remove link
    //  * @param link
    //  */
    // async removeLink(username: string): Promise<boolean> {
    //     await this.updateItem(username, { token: null });
    //     return true;
    // }

    //this is for the automation only:
    async getLink(username: string): Promise<{ link: string; date: Date; }> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        return {
            link: storedUser.getToken(),
            date: storedUser.getTokenDate()
        };
    }

    // async getUsernameByLink(token: string): Promise<string> {
    //     simple_query.query.term.token = token;
    //     const items: any[] = await this.search(simple_query);
    //     if(!items || items.length == 0)
    //         throw new Error("Could not find any user with this link.");
    //
    //     return items[0].email;
    // }
}
