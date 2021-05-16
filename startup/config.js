module.exports = () => {
  if (!process.env.MONGODB_URL) {
    throw new Error('Required Environment variable: MONGODB_URL');
  }
  if (!process.env.JWT_KEY) {
    throw new Error('Required Environment variable: JWT_KEY');
  }
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('Required Environment variable: SENDGRID_USERNAME');
  }
  if (!process.env.FRONTEND_DOMAIN) {
    throw new Error('Required Environment variable: FRONTEND_DOMAIN');
  }
  if (!process.env.BACKEND_DOMAIN) {
    throw new Error('Required Environment variable: BACKEND_DOMAIN');
  }
  if (!process.env.PYTHON_BACKEND_DOMAIN) {
    throw new Error('Required Environment variable: PYTHON_BACKEND_DOMAIN');
  }
};
