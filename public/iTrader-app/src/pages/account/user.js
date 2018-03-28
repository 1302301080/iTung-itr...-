import React, { Component } from 'react';
import { Button } from 'react-weui';
import $ from 'jquery'
import LayoutConfig from '../../config/layout.config';

export default class User extends Component {
    constructor() {
        super();
        this.state = {
            lastUpdate: null
        }
        this.userInfo = {}
        this.initialize()
    }
    initialize() {
        var that = this
        $.get('/iTrader/account', function (data) {
            if (!data || !data.data) return
            data = data.data
            for (var i in data) {
                if (i == 'margin_type') {
                    if (data[i] == "1") {
                        data[i] = messages.app_column_account_user_margin.text
                    } else {
                        data[i] = messages.app_column_account_user_cash.text
                    }
                }
                that.userInfo[i] = data[i]
            }
            that.setState({ lastUpdate: (new Date()).getTime() })
        })
    }

    accountUser() {
        var userInfo = LayoutConfig.account.user
        return (
            userInfo.map((item, index) => {
                return (
                    <div className="act-line border-bottom-1px" key={index}>
                        <span className="act-spanl">{item.name}</span>
                        <span className="act-spanr">{(this.userInfo ? this.userInfo[item.key] : '--') || '--'}</span>
                    </div>
                );
            })
        )
    }
    render() {
        return (
            <div className="">
                <div className="act-cont itrader-color" >
                    {this.accountUser()}
                </div>
                <div className="itrader-btnbg itrader-mgtop50">
                    <Button
                        type="warn"
                        onClick={function () { location.href = '/iTrader/user/logout' }}
                    >
                        {messages.app_column_logout.text}
                    </Button>
                </div>
            </div>
        );
    }
}