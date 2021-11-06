import express, {Express, Request, Response} from "express";
import { constructBrowsePathFromQualifiedName } from "node-opcua";
import appJson from "./apiRules.json";
import {Server, Socket} from "socket.io";
import ioclient from "socket.io-client";
//const socketIO = require("socket.io");
import {createServer} from "http";

import {OpcDataHandler} from "./OpcDataHandler";
import { ClassStaticBlockDeclaration, isExpressionStatement } from "typescript";



export class CustomServer {

    private app: Express = express();
    private httpServer = createServer(this.app);
    private io = new Server(this.httpServer);
    public opcdatahandler: OpcDataHandler;

    constructor(port: number) {
        this.opcdatahandler = new OpcDataHandler();
        this.opcdatahandler.connectToServer();

        //formerly as function start()
        this.io.on("connection", socket => {});
        var ioserver = this.httpServer.listen(port);
            //this.app.listen(port, () => console.log(`Server listening on port ${port}!`))
        //this.opcdatahandler.addMonitoredItem("testInt");
      
    
        
        this.app.get("/api", (req: Request, res: Response): void => {
            res.json(appJson);
        });


                //response to addMonitoredItem request from frontend
                this.app.get("/api/addMonitoredItem/:name", (req: Request, res: Response): void => {
                    this.opcdatahandler.addMonitoredItem(req.params.name);
                });


        //response to readBoolTag request from frontend
        this.app.get("/api/readBoolTag/:name", (req: Request, res: Response): void => {
            this.opcdatahandler.readBoolTag(req.params.name, (val: boolean) => {
                var returnJson = {};
                returnJson["name"]= req.params.name;
                returnJson["value"] = val.toString();
                res.json(returnJson);
            });
        });

                //response to readBoolTag request from frontend
                this.app.get("/api/readIntTag/:name", (req: Request, res: Response): void => {
                    this.opcdatahandler.readIntTag(req.params.name, (val: number) => {
                        var returnJson = {};
                        returnJson["name"]= req.params.name;
                        returnJson["value"] = val.toString();
                        res.json(returnJson);
                    });
                });


        //response to writeBoolTag request from frontend
        this.app.get("/api/writeBoolTag/:name/:val",(req: Request, res: Response): void => {
            this.opcdatahandler.writeBoolTag(req.params.name, Boolean(req.params.name));
            res.send("You wrote to variable: " + req.params.name +", and assigned a value of: " + req.params.val);
        });

        this.io.on("connection", function(socket: any){
            console.log("a user connected");

        });




    }

    private server: Server;


    public start(port: number) {
        this.io.on("connection", socket => {});
        var ioserver = this.httpServer.listen(port);
            //this.app.listen(port, () => console.log(`Server listening on port ${port}!`))
        this.opcdatahandler.addMonitoredItem("testInt");
    }

}