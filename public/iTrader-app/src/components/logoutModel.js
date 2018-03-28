import React, { Component } from 'react';

import Header from './header';
import dataCenter from '../lib/data';

export default class LogoutModel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            action: null,
            errMsg: ''
        }
        this.getMessage()
    }

    getMessage() {
        var that = this
        dataCenter.subscribe('message', function (data) {
            if (data) {
                if (data.logoutUser) {
                    var item = data.logoutUser
                    that.setState({
                        action: item.action,
                        errMsg: item.error,
                    })
                }
            }
        })
    }
    logoutBtn() {
        location.href = '/iTrader/user/logout'
        sessionStorage.clear()
    }

    render() {
        return (
            <div className="logoutModel" style={{ display: this.state.action === null ? 'none' : 'block' }}>
                <Header />
                <div className="logout-bg">
                    <div className="logout-col">
                        <div className="logout-title">
                            {messages.app_message_error_title.text}
                        </div>
                        <div className="logout-cont">
                            <span>{this.state.errMsg}</span>
                        </div>
                        <div className="logout-bottomClose" onClick={this.logoutBtn.bind(this)}>{messages.app_btn_sure.text}</div>
                    </div>
                </div>
            </div>
        );
    }
};
