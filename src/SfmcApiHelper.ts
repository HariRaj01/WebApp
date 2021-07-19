'use strict';

import axios from 'axios';
import express = require("express");
import Utils from './Utils';

export default class SfmcApiHelper
{
    // Instance variables
    private _deExternalKey = "DF18Demo";
    private _sfmcDataExtensionApiUrl = "https://mcj6cy1x9m-t5h5tz0bfsyqj38ky.auth.marketingcloudapis.com/hub/v1/dataevents/key:" + this._deExternalKey + "/rowset";

    /**
     * getOAuthAccessToken: POSTs to SFMC Auth URL to get an OAuth access token with the given ClientId and ClientSecret
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-getting-started.meta/mc-getting-started/get-access-token.htm
     * 
     */
    public getOAuthAccessToken(client_id: string, client_secret: string) : Promise<any>
    {
        let self = this;
        Utils.logInfo("getOAuthAccessToken called.");
        Utils.logInfo("Using specified ClientID and ClientSecret to get OAuth token...");

        let headers = {
            'Content-Type': 'application/json',
        };

        let postBody = {

            "grant_type": "client_credentials",
            "client_id": "di1y81v0ita8ja5qume0em4l",
            "client_secret": "e9NdAPGQZUuVnt6qkCdNHQF3"
        };

        return self.getOAuthTokenHelper(headers, postBody);
    }

    /**
     * getOAuthAccessTokenFromRefreshToken: POSTs to SFMC Auth URL to get an OAuth access token with the given refreshToken
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-getting-started.meta/mc-getting-started/get-access-token.htm
     * 
     */
    public getOAuthAccessTokenFromRefreshToken(client_id: string, clientSecret: string, refreshToken: string) : Promise<any>
    {
        let self = this;
        Utils.logInfo("getOAuthAccessTokenFromRefreshToken called.");
        Utils.logInfo("Getting OAuth Access Token with refreshToken: " + refreshToken);
        
        let headers = {
            'Content-Type': 'application/json',
        };

        let postBody = {
            "grant_type": "client_credentials",
            "client_id": "di1y81v0ita8ja5qume0em4l",
            "client_secret": "e9NdAPGQZUuVnt6qkCdNHQF3"
        };

        return self.getOAuthTokenHelper(headers, postBody);
    }

    /**
     * getOAuthTokenHelper: Helper method to POST the given header & body to the SFMC Auth endpoint
     * 
     */
    public getOAuthTokenHelper(headers : any, postBody: any) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            // POST to Marketing Cloud REST Auth service and get back an OAuth access token.
            let sfmcAuthServiceApiUrl = "https://mcj6cy1x9m-t5h5tz0bfsyqj38ky.auth.marketingcloudapis.com/v2/token";
            axios.post(sfmcAuthServiceApiUrl, postBody, {"headers" : headers})
            .then((response: any) => {
                // success
                let accessToken = response.data.access_token;
                let tokenExpiry = new Date();
                let jsonData = response.data.jsonData;
                tokenExpiry.setSeconds(tokenExpiry.getSeconds() + response.data.expiresIn);
                Utils.logInfo("Got OAuth token: " + accessToken + ", expires = " +  tokenExpiry);
                console.log("token:",accessToken);
                console.log("expiry:",tokenExpiry);
                console.log("response:",response.data);
                console.log("SJsonData:",jsonData)

                resolve(
                {
                    oauthAccessToken: accessToken,
                    oauthAccessTokenExpiry: tokenExpiry,
                    JSON:jsonData,
                    status: response.status,
                    statusText: response.statusText + "\n" + Utils.prettyPrintJson(JSON.stringify(response.data))
                });
            })
            .catch((error: any) => {
                // error
                let errorMsg = "Error getting OAuth Access Token.";
                errorMsg += "\nMessage: " + error.message;
                errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
                errorMsg += "\nResponse data: " + error.response ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
                Utils.logError(errorMsg);

                reject(errorMsg);
            });
        });
    }

    /**
     * loadData: called by the GET handlers for /apidemoloaddata and /appdemoloaddata
     * 
     */
    public loadData(req: express.Request, res: express.Response)
    {
        let self = this;
        let sessionId = req.session.id;
        Utils.logInfo("loadData entered. SessionId = " + sessionId);

        console.log("Request Session:",req.session)
        if (req.session.oauthAccessToken)
        {
            Utils.logInfo("Using OAuth token: " + req.session.oauthAccessToken);
            self.loadDataHelper(req.session.oauthAccessToken, req.session.sampleJsonData)
            .then((result) => {
                res.status(result.status).send(result.statusText);
            })
            .catch((err) => {
                res.status(500).send(err);
            });
        }
        else
        {
            // error
            let errorMsg = "OAuth Access Token *not* found in session.\nPlease complete previous demo step\nto get an OAuth Access Token."; 
            Utils.logError(errorMsg);
            res.status(500).send(errorMsg);
        }
    }

    /**
     * loadDataHelper: uses the given OAuthAccessToklen to load JSON data into the Data Extension with external key "DF18Demo"
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/postDataExtensionRowsetByKey.htm
     * 
     */
    private loadDataHelper(oauthAccessToken: string, jsonData: string) : Promise<any>    
    {
        let self = this;
        Utils.logInfo("loadDataHelper called.");
        Utils.logInfo("Loading sample data into Data Extension: " + self._deExternalKey);
        Utils.logInfo("Using OAuth token: " + oauthAccessToken);
        Utils.logInfo("JSON :"+ jsonData);

        return new Promise<any>((resolve, reject) =>
        {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + oauthAccessToken
            };

            // POST to Marketing Cloud Data Extension endpoint to load sample data in the POST body
            console.log("ApiUrl:",self._sfmcDataExtensionApiUrl);
            console.log("AuthTokken:",oauthAccessToken);
            console.log("Json data:",jsonData);
            axios.post(self._sfmcDataExtensionApiUrl, jsonData, {"headers" : headers})
            .then((response: any) => {
                // success
                Utils.logInfo("Successfully loaded sample data into Data Extension!");

                resolve(
                {
                    status: response.status,
                    statusText: response.statusText + "\n" + Utils.prettyPrintJson(JSON.stringify(response.data))
                });
            })
            .catch((error: any) => {
                // error
                let errorMsg = "Error loading sample data. POST response from Marketing Cloud:";
                errorMsg += "\nMessage: " + error.message;
                errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
                errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
                Utils.logError(errorMsg);

                reject(errorMsg);
            });
        });
    }
}
