## NLP-Suite-Backend

This is the project that I did in my senior year. It is the NodeJS powered backend part of the project **NLP-Suite**.

This project has three parts:

1. **Frontend**: The UI with which the users will interact. This UI will make use of NodeJS powered backend API for registering and handling user's information.
2. **NodeJs Backend**: The backend which handles all users and their information with proper authentication. This is the backend that is powered by NodeJS.
3. **Flask Backend**: The backend where trained NLP-models are deployed. This is the backend that is powered by Flask.

The deployment architecture could be following:
1. The **Frontend** may be deployed to the same server where NodeJs backend is deployed or could be on a different server. This frontend must be configured to be accessible by remote computers.
2. The **NodeJs Backend** should be deployed to a network and configured to be accessible by remote computers.
3. The **Flask Backend** should be deployed to the same server where NodeJs Backend is deployed and configured to be accessible by _only local computers_ in the networks.

### Instructions

1. Download or clone this repo.
2. Run `npm install` to install required dependencies.
3. While dependencies are getting installed, create `.env` file in the root directory of the project and add the following keys.

```
MONGODB_URL=YOUR_MONGODB_URL
JWT_KEY=YOUR_SECRET_JWT_KEY
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
FRONTEND_DOMAIN=YOUR_DOMAIN_ON_WHICH_FRONTEND_OF_THIS_PROJECT_IS_RUNNING
BACKEND_DOMAIN=YOUR_DOMAIN_ON_WHICH_NODEJS_BACKEND_OF_THIS_PROJECT_IS_RUNNING
PYTHON_BACKEND_DOMAIN=YOUR_DOMAIN_ON_WHICH_FLASK_BACKEND_OF_THIS_PROJECT_IS_RUNNING
```

4. Once above steps are complete, run `node bin/dev.js`

```
HAPPY CODING 💻
HAPPY LEARNING 📚
```
