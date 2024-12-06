import dotenv from "dotenv";
dotenv.config({ path: ".env" });
// Env file configuration
function config(Env: any) {
  return {
    databaseUrl: Env?.DATABASE_URL,
    port: Env?.REST_API_PORT,
    accessTokenSecretKey: Env?.SECRET_KEY,
    qbSoapBaseUrl: Env?.QB_SOAP_BASEURL,
    qbSoapPort: Env?.QB_SOAP_PORT,
    accessTokenExpireTime: 30 * 24 * 60 * 60, // 30 days in seconds
    companyId: Env?.COMPANY_ID,
    categoryDataFieldName: Env?.CATEGORY_DATA_FIELD_NAME,
    reactAppBaseUrl: Env?.REACT_APP_BASE_URL,
    smtpEmail: Env?.SMTP_EMAIL,
    smtpEmailLogin: Env?.SMTP_EMAIL_LOGIN,
    smtpPassword: Env?.SMTP_PASSWORD,
    smtpHost: Env?.SMTP_HOST,
    smtpPort: Env?.SMTP_PORT,
    forgotPasswordTokenSecretKey: Env?.FORGOT_PASSWORD_TOKEN_SECRET_KEY,
    forgotPasswordUrlExpireTime: 30 * 60 * 1000,
    resetPasswordReactUrl: `${Env?.REACT_APP_BASE_URL}/reset-password`,
    changePasswordReactUrl: `${Env?.REACT_APP_BASE_URL}/reset-password`,
    verifyEmail: `${Env?.REACT_APP_BASE_URL}/login`,
  };
}

export default {
  ...config(process.env),
};
