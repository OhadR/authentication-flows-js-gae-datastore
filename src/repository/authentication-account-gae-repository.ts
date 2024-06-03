import { AuthenticationAccountRepository,
	AuthenticationUser,
    AuthenticationUserImpl } from 'authentication-flows-js';
import { Datastore, Entity, Key, Query } from '@google-cloud/datastore';
const debug = require('debug')('authentication-account-appengine');

const AUTH_FLOW_DATASTORE_KIND: string = 'authentication-flows-user';
const USER_TYPE = "GaeUser";
const USER_FORENAME = "forename";
const USER_SURNAME = "surname";
const USER_NICKNAME = "nickname";
const USER_EMAIL = "email";
const USER_ENABLED = "enabled";
const USER_AUTHORITIES = "authorities";

export class AuthenticationAccountGAERepository implements AuthenticationAccountRepository {

    // Creates a client
    private datastore = new Datastore();

    constructor() {}

    // Records, called "entities" in Datastore, are retrieved by using a key. The
    // key is more than a numeric identifier, it is a complex data structure that
    // can be used to model relationships. The simplest key has a string `kind`
    // value, and either a numeric `id` value, or a string `name` value.
    //
    // A single record can be retrieved with {@link Datastore#key} and
    // {@link Datastore#get}.
    async getEntityByUsername(username: string) : Promise<Entity> {
        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND, username]);
        debug(key);
        let entities : Entity[];
        try {
            entities = await this.datastore.get(key);
        } catch (e) {
            debug(`ERROR (getEntityByUsername): ${e}`, e);
        }

        if(entities.length > 1)
            throw new Error(`found more than a single record with the name=${username}`);

        debug(entities[0]);
        return entities[0];
    }

    async loadUserByUsername(username: string): Promise<AuthenticationUser> {

        const entity : Entity = await this.getEntityByUsername(username);

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

    async setEnabled(username: string) {
        await this.setEnabledFlag(username, true);
    }

    async setDisabled(username: string) {
        await this.setEnabledFlag(username, false);
    }

    protected async setEnabledFlag(username: string, enabled: boolean) {
        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND]);
        const entity = {
            key: key,
            data: {
                rating: '10'
            }
        };
        await this.datastore.save(username);
    }

    async isEnabled(username: string): Promise<boolean> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        if (!storedUser)
            return false;
        return await storedUser.isEnabled();
    }

    //TODO: should be in abstract class
    async decrementAttemptsLeft(username: string) {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        let attempts = storedUser.getLoginAttemptsLeft();
        debug(`current num attempts: ${attempts}`);
        await this.setAttemptsLeft(username, --attempts);
    }

    async setAttemptsLeft(username: string, loginAttemptsLeft: number) {
        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND]);
        const entity = {
            key: key,
            data: {
                loginAttemptsLeft: loginAttemptsLeft
            }
        };
        await this.datastore.save(entity);
    }

    async setPassword(username: string, newPassword: string) {
        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND]);
        const entity = {
            key: key,
            data: {
                encodedPassword: newPassword,
                token: null,
                tokenDate: null
            }
        };
        await this.datastore.save(entity);
    }

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

    async createUser(authenticationUser: AuthenticationUser): Promise<void> {
        debug('createUser / GAE implementation!');

        const newUser: AuthenticationUser = new AuthenticationUserImpl(authenticationUser.getUsername(),
            authenticationUser.getPassword(),
            false,
            authenticationUser.getLoginAttemptsLeft(),
            new Date(),
            authenticationUser.getFirstName(),
            authenticationUser.getLastName(),
            authenticationUser.getAuthorities(),
            authenticationUser.getToken(),
            authenticationUser.getTokenDate());

        debug(`newUSer: ${JSON.stringify(newUser)}`);

        if( await this.userExists( newUser.getUsername() ) ) {
            //ALREADY_EXIST:
            throw new Error(`user ${newUser.getUsername()} already exists`);
        }

        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND, newUser.getUsername()]);
        debug(key);
        const entity = {
            key: key,
            data: {
                name: newUser.getUsername(),        //GAE demands "name" (string) or "id" (numeric)
                ...newUser}
        };
        await this.datastore.save(entity);
    }

    async deleteUser(username: string): Promise<void> {
        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND, username]);
        await this.datastore.delete(key);
    }

    async userExists(username: string): Promise<boolean> {
        debug('userExists?');
        return false;//TODO
        // return await this.exists(username);
    }

    async addLink(username: string, link: string) {
        debug('addLink');//TODO REMOVE
        let entity : Entity = await this.getEntityByUsername(username);

        entity = {
            ...entity,
            token: link,
            tokenDate: new Date()
        }
        await this.datastore.save(entity);
    }

    /**
     * remove link
     * @param link
     */
    async removeLink(username: string): Promise<boolean> {
        const key : Key = this.datastore.key([AUTH_FLOW_DATASTORE_KIND]);
        const entity = {
            key: key,
            data: {
                token: null,
            }
        };
        await this.datastore.save(entity);
        return true;
    }

    //this is for the automation only:
    async getLink(username: string): Promise<{ link: string; date: Date; }> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        return {
            link: storedUser.getToken(),
            date: storedUser.getTokenDate()
        };
    }

    async getUsernameByLink(token: string): Promise<string> {
        debug('getUsernameByLink');//TODO REMOVE
        const query : Query = this.datastore.createQuery(AUTH_FLOW_DATASTORE_KIND);
        query.filter('token', token);
        const items : Entity[] = await this.datastore.runQuery(query);
        debug('getUsernameByLink: items:');//TODO REMOVE
        debug(items);//TODO REMOVE

        if(!items || items.length == 0)
            throw new Error("Could not find any user with this link.");

        return items[0].email;
    }
}
