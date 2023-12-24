# Simple User Panel

## Creator
### Hey there! I'm Erik and this is a simple project for my portfolio.  
*If you're interested in my work, please be welcome to visit my [GitHub Profile](https://github.com/erikhenriqueal)!*

## About the Project
### Purpose:
- This project was created to improve my experience with user management systems.
### Learning:
- Express Skills Improvement (Static Pages and Routering)
- SQL Users Handling (CRUD Application)
- User Credentials Encrypting (BCrypt Hashing)
- Server-side Cookies Processing (cookies-parser)
- Server-side User Tokenizing (JSON Web Tokenizer)
### Note:
- This was my first real project for web pages. Any feedback is welcome!

## Project Structure:
### Database:
- The Database System used here is [MySQL](https://www.mysql.com/) (using [mysql2](https://www.npmjs.com/package/mysql2) library).
- All Database's schematics is on [database.sql](./database.sql) so you can just execute this file to create your own database on localhost.
- Your Database's information must be defined on [.env](./.env.example) file.
### API:
- The [api](./api/) folder contains everything about the API. That holds the routes and Database's functions, including the security system.
### Public:
- The [public](./public/) path is used as a static path to handle all pages of our application, such as [Home Page](./public/index.html), [Login Page](./public/login.html), [Register Page](./public/register.html) and [Dashboard](./public/dashboard.html)