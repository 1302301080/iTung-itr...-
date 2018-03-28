import React, { Component } from 'react';



export default class SingleNav extends Component {
    constructor(props) {
        super(props);
        this.singleData = this.props.single
        this.state = {
        }

    }

    render() {
        return (
            <div className="singleHead">
                <div className="backBtn" onClick={() => { window.history.go(-1) }}><i className="fa fa-arrow-left"></i></div>
                <div className="singleCont">{this.singleData}</div>
            </div>
        );
    }
};
