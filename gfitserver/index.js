const express = require("express");
const app = express();
const PORT = 3000;

const { google } = require("googleapis");
const request = require("request");
const cors = require("cors");
const urlParse = require("url-parse");
const queryParse = require("query-string");
const bodyParser = require("body-parser");
const axios = require("axios");
const moment = require("moment");
const { OAUTH_SECRETS, ACCESS_TYPE, GOOGLE_SCOPES } = require("./strings");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res, next) => {
  res.send({ msg: "hit" });
});

app.get("/get-steps", (req, res, next) => {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_SECRETS.client_id,
    OAUTH_SECRETS.client_secret,
    OAUTH_SECRETS.redirect_uri
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: ACCESS_TYPE.OFFLINE,
    scope: GOOGLE_SCOPES,
    state: JSON.stringify({
      callbackUrl: req.body.callbackUrl,
      userId: req.body.userId,
    }),
  });
  request(url, (err, response, body) => {
    if (err) console.log({ err });
    // if (response) console.log({ response });
    res.send({ url });
  });
});
app.get("/steps", async (req, res, next) => {
  const queryUrl = new urlParse(req.url);
  const code = queryParse.parse(queryUrl.query).code;

  const oauth2Client = new google.auth.OAuth2(
    OAUTH_SECRETS.client_id,
    OAUTH_SECRETS.client_secret,
    OAUTH_SECRETS.redirect_uri
  );

  const tokenResponse = await oauth2Client.getToken(code);
  // console.log({ tokenResponse });
  try {
    const result = await axios({
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenResponse.tokens.access_token}`,
      },
      url: `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      data: {
        aggregateBy: [
          {
            dataTypeName: "com.google.step_count.delta",
            dataSourceId:
              "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
          },
        ],
        bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
        startTimeMillis: moment().startOf("day").valueOf(),
        endTimeMillis: moment().endOf("day").valueOf(),
      },
    });
    res.send({
      bucket: result.data.bucket,
    });
  } catch (e) {
    console.log({ e });
  }
});

app.listen(PORT, () => {
  console.log({ msg: "server is up and running!", port: PORT });
});
