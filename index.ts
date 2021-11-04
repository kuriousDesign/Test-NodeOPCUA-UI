import {CustomServer} from "./app/CustomServer";
import express from 'express';
//const app = express();

const port = 8080;

const server = new CustomServer();
server.start(port);