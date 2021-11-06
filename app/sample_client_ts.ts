
import {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    makeBrowsePath,
    ClientSubscription,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ReadValueIdOptions,
    ClientMonitoredItem,
    UserTokenType,
    UserIdentityInfoUserName,
    MonitoringMode,
    DataValue
  } from "node-opcua";
  
  
  
  const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1
  };
  const client = OPCUAClient.create({
    applicationName: "NodeOPCUA-Client2",
    connectionStrategy: connectionStrategy,
    securityMode: MessageSecurityMode.SignAndEncrypt,
    securityPolicy: SecurityPolicy.Basic256Sha256,
    endpointMustExist: false
  });


// the credential 
const adminUserIdentityToken: UserIdentityInfoUserName = {
    type: UserTokenType.UserName,
    userName: "admin",
    password: "admin"
};


  //const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543";
  const endpointUrl = "opc.tcp://Jakers-Laptop:4840";
  
  
  async function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function main() {
    try {
      // step 1 : connect to
      await client.connect(endpointUrl);
      console.log("connected !");
  
      // step 2 : createSession
      const session = await client.createSession(adminUserIdentityToken);
      console.log("session created !");
  
      // step 3 : browse
      const browseResult = await session.browse("RootFolder");
      
      console.log("references of RootFolder :");
      for (const reference of browseResult.references) {
        console.log("   -> ", reference.browseName.toString());
      }
  
    //   // step 4 : read a variable with readVariableValue
    //   const dataValue2 = await session.read({
    //     nodeId: "ns=1;s=free_memory",
    //     attributeId: AttributeIds.Value
    //   });
    //   console.log(" value = ", dataValue2.toString());
  
    //   // step 4' : read a variable with read
    //   const maxAge = 0;
    //   const nodeToRead = {
    //     nodeId: "ns=3;s=Scalar_Simulation_String",
    //     attributeId: AttributeIds.Value
    //   };
    //   const dataValue = await session.read(nodeToRead, maxAge);
    //   console.log(" value ", dataValue.toString());
  
      // step 5: install a subscription and install a monitored item for 10 seconds
      const subscription = ClientSubscription.create(session, {
        requestedPublishingInterval: 100,
        requestedLifetimeCount: 1,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10
      });
      
      subscription
        .on("started", function() {
          console.log(
            "subscription started for 2 seconds - subscriptionId=",
            subscription.subscriptionId
          );
        })
        .on("keepalive", function() {
          console.log("keepalive");
        })
        .on("terminated", function() {
          console.log("subscription terminated");
        });
      
      // install monitored item
      
      const nodeIdBase = "ns=4;s=|var|CODESYS Control Win V3 x64.Application.HMI.";
      var tag = "testStatus";
      var nodeIdTag = nodeIdBase + tag;

      const itemToMonitor: ReadValueIdOptions = {
        nodeId: nodeIdTag,
        attributeId: AttributeIds.Value
      };
      const parameters: MonitoringParametersOptions = {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10
      };
      
      

      const monitoredItem = ClientMonitoredItem.create(
        subscription,
        itemToMonitor,
        parameters,
        TimestampsToReturn.Both
      );
      
      monitoredItem.on("changed", (dataValue: DataValue) => {
        console.log(" value has changed : ", dataValue.value.toString());
      });
      
      await timeout(5000);

      monitoredItem.setMonitoringMode(MonitoringMode.Disabled);
      console.log("monitoring mode: disabled");

      await timeout(5000);

      monitoredItem.setMonitoringMode(MonitoringMode.Reporting);
      console.log("monitoring mode: reporting");

      await timeout(10000);

      
      console.log("now terminating subscription");
      await subscription.terminate();
  
      // step 6: finding the nodeId of a node by Browse name
      // const browsePath = makeBrowsePath(
      //   "RootFolder",
      //   "/Objects/Server/Namespaces.NamespacesType"
      // );
      //"/Objects/Server/CODESYS Control Win V3 x64/Resources/Application/GlobalVars/HMI.testInt"
      //const result = await session.translateBrowsePath(browsePath);
      //console.log(result.targets);
      //const productNameNodeId = result.targets[0].targetId;
      //console.log(" Product Name nodeId = ", productNameNodeId.toString());
  
      // close session
      await session.close();
  
      // disconnecting
      await client.disconnect();
      console.log("done !");
    } catch(err) {
      if (err instanceof Error) {
          console.log("An error has occurred : ", err);
      }
    }
  }
  main();