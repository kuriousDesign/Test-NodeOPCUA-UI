import React, {Component, useState} from "react";
import axios from "axios";

export default class TestPage extends Component {
    constructor(){
        super();
        this.state = {
            testButton: "not yet gotten",
            testStatus: "not yet gotten",
            testInt: "not yet gotten"
        };
        this.handleButtonClick();
        this.loadData = this.loadData.bind(this);

    }

    async loadData(){
        axios.get("/api/readBoolTag/testStatus").then(response => {
                this.setState({
                    testStatus : response.data.value
                }) 
        });

         axios.get("/api/readIntTag/testInt").then(response => {
            this.setState({
                testInt : response.data.value
            }) 
        });

        if(this.state.testStatus){

        }
    }

    
    componentDidMount(){
        //runs this.loadData() at the frequency of every 1000ms 
        setInterval(this.loadData,5000);
    }


    handleButtonClick = () => {
        axios.get("/api/writeBoolTag/testButton/true").then(response => {
            this.loadData();
        });
       
    };

    render() {
        return (
            <div>
                <button onClick={this.handleButtonClick}>Push Me  Now</button>
                <h1> testStatus is: {this.state.testStatus} </h1>
                <h1> testInt is: {this.state.testInt} </h1>
            </div>
        )
    }
}

