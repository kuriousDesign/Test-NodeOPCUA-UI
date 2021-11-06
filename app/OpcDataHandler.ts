import { OPCUAClient, MessageSecurityMode, SecurityPolicy, AttributeIds, makeBrowsePath, BrowsePathResult, ClientSubscription, TimestampsToReturn, MonitoringParametersOptions, ReadValueIdOptions, ClientMonitoredItem, DataValue, StatusCodes, DataType, UserIdentityInfoUserName, UserTokenType, MonitoringMode, writeTCPMessageHeader, ClientSession } from "node-opcua";
import { isObjectBindingPattern } from "typescript";
import { Server, Socket } from "socket.io";

interface DataValueBoolean {
  dataType: string;
  arrayTpe: string;
  value: boolean;
}

interface DataValueNumber {
  dataType: string;
  arrayTpe: string;
  value: number;
}

export class OpcDataHandler {
  private session: ClientSession;
  private connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1,
  };

  private options = {
    applicationName: "NodeOPCUA-Client",
    connectionStrategy: this.connectionStrategy,
    securityMode: MessageSecurityMode.SignAndEncrypt,
    securityPolicy: SecurityPolicy.Basic256Sha256,
    endpointMustExist: false,
  };

  private endpointUrl = "opc.tcp://Jakers-Laptop:4840";

  // the credentials
  private adminUserIdentityToken: UserIdentityInfoUserName = {
    type: UserTokenType.UserName,
    userName: "admin",
    password: "admin",
  };

  private client: OPCUAClient;
  private subscription: ClientSubscription;
  private maxAge = 0;
  private nodeIdBase = "ns=4;s=|var|CODESYS Control Win V3 x64.Application.HMI.";

  constructor() {
    this.client = OPCUAClient.create(this.options);
    //this.connectToServer();
  }

  public async connectToServer() {
    try {
      // step 1 : connect to
      await this.client.connect(this.endpointUrl);
      console.log("connected !");

      // step 2 : createSession
      this.session = await this.client.createSession(this.adminUserIdentityToken);
      console.log("session created !");

      await this.createSubscription();

      process.on("SIGINT", function () {
        console.log("\ngracefully shutting down from SIGINT (Crtl-C)");
        //this.closeAndDisconnect();
        process.exit();
      });

      process.on("exit", function () {
        console.log("never see this log message");
      });
    } catch (err) {
      console.log("An error has occured : ", err);
    }
  }

  public async readBoolTag(tag: string, cb: (val: boolean) => any) {
    var nodeId = this.nodeIdBase + tag;
    var nodeToRead = {
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
    };
    var dataValue = await this.session.read(nodeToRead, this.maxAge);
    //console.log("dataValue from readBoolTag: ", dataValue.toString())
    var output = this.extractBoolean(dataValue);
    //console.log("output from readBoolTag/" + tag, ":", output.toString())
    cb(output);
    return output;
  }

  public async readIntTag(tag: string, cb: (val: number) => any) {
    var nodeId = this.nodeIdBase + tag;
    var nodeToRead = {
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
    };
    var dataValue = await this.session.read(nodeToRead, this.maxAge);
    //console.log("dataValue from readIntTag: ", dataValue.toString())
    var output = this.extractInt(dataValue);
    //console.log("output from readIntTag/" + tag, ":", output.toString())
    cb(output);
    return output;
  }

  public extractBoolean(dataValue: DataValue) {
    //console.log(" Read of testStatus: ", dataValue.toString());
    var jsonString = JSON.stringify(dataValue.value.toJSON());
    let obj: DataValueBoolean = JSON.parse(jsonString);
    var output = obj.value;
    return output;
  }

  public extractInt(dataValue: DataValue) {
    //console.log(" Read of testStatus: ", dataValue.toString());
    var jsonString = JSON.stringify(dataValue.value.toJSON());
    let obj: DataValueNumber = JSON.parse(jsonString);
    var output = obj.value;
    return output;
  }

  public async writeBoolTag(tag: string, value: boolean) {
    var nodeId = this.nodeIdBase + tag;
    var dataToWrite = {
      dataType: DataType.Boolean,
      value: value,
    };

    var nodeToWrite = {
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        sourceTimestamp: new Date(),
        statusCode: StatusCodes.Good,
        value: dataToWrite,
      },
    };

    let result = await this.session.write(nodeToWrite);
    //console.log("write result: ", result.toString());
    return result;
  }

  public async createSubscription() {
    console.log("creating subscription");
    this.subscription = ClientSubscription.create(this.session, {
      requestedPublishingInterval: 100,
      requestedLifetimeCount: 1,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10,
    });

    var subscriptionId = this.subscription.subscriptionId;

    this.subscription
      .on("started", function () {
        console.log("Subscription Started - subscriptionId=", subscriptionId);
      })
      .on("keepalive", function () {
        //console.log("keepalive");
      })
      .on("terminated", function () {
        console.log(" Subcription Terminated ------------------------------>");
      });

    //this.addMonitoredItem("testCnt");
  }

  public async addMonitoredItem(tag: string) {
    // install monitored item
    var nodeIdTag = this.nodeIdBase + tag;
    var itemToMonitor: ReadValueIdOptions = {
      nodeId: nodeIdTag,
      attributeId: AttributeIds.Value,
    };

    var parameters: MonitoringParametersOptions = {
      samplingInterval: 100,
      discardOldest: true,
      queueSize: 10,
    };

    var monitoredItem = ClientMonitoredItem.create(this.subscription, itemToMonitor, parameters, TimestampsToReturn.Both);

    monitoredItem.on("changed", (dataValue: DataValue) => {
      console.log(tag, " value has changed : ", dataValue.value.toString());
      // ioserver.sockets.emit('message', {
      //     value: dataValue.value.value,
      //     timestamp: dataValue.serverTimestamp,
      //     nodeId: nodeIdTag,
      //     browseName: "testInt"
      // });
    });
    return monitoredItem;
  }

  public async closeAndDisconnect() {
    // terminate subscription
    await this.subscription.terminate();

    // close session
    await this.session.close();

    // disconnecting
    await this.client.disconnect();
    console.log("Closed and Disconnected from OPCUA server");
  }

  private async main() {
    try {
      // step 1 : connect to server and create session
      await this.connectToServer();

      // step 2' : read a variable with read
      var val1 = await this.readBoolTag("testStatus", () => {});
      console.log("testStatus before write: ", val1.toString());

      // step 3: write to testButton
      var writeResult = await this.writeBoolTag("testButton", true);

      // step 4: re-read testStatus
      var val2 = await this.readBoolTag("testStatus", () => {});
      console.log("testStatus after write: ", val2.toString());

      // close session and disconnect
      await this.closeAndDisconnect();
      console.log("Disconnected and now done!");
    } catch (err) {
      console.log("An error has occured : ", err);
    }
  }
} //end of class
