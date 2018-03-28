import React, { Component } from 'react';
import {
    Link,
} from 'react-router';
import { Button, ButtonArea, Dialog } from 'react-weui';

import mappingConfig from '../config/mapping.config'

var langs = [
    { id: 'en-US', name: 'English', flag: 'flag-icon flag-icon-us' },
    { id: 'zh-CN', name: '简体中文', flag: 'flag-icon flag-icon-cn' },
    { id: 'zh-HK', name: '繁體中文', flag: 'flag-icon flag-icon-hk' },
]

export default class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            urls: '',
            modalIsOpen: false,
            language: false,
            slanguage: document.getElementById("language").value || localStorage.getItem("language") || 'zh-CN'
        }
        this.logoutModal = {
            title: messages.app_message_info_title.text,
            buttons: [
                {
                    type: 'default',
                    label: messages.app_btn_cancel.text,
                    onClick: this.cancelDialog.bind(this)
                },
                {
                    type: 'primary',
                    label: messages.app_btn_sure.text,
                    onClick: this.logoutDialog.bind(this)
                }
            ]
        }
    }


    cancelDialog() {
        this.setState({
            modalIsOpen: false,
        });
    }
    logoutDialog() {
        sessionStorage.clear()
        location.href = '/iTrader/user/logout'
    }
    logoutbtn() {
        this.setState({ modalIsOpen: true })
    }


    getLanguage(id) {
        for (var item of langs) {
            if (id === item.id) return item
        }
    }
    getRequest() {
        var that = this
        var result = window.location.href
        result = result.substring(result.indexOf("#/") + 2, result.indexOf("?_k"))
        that.setState({ urls: result })
    }
    selectLanguage(e) {
        var language = e.target.getAttribute('data-language')
        localStorage.setItem("language", language);
        location.href = "?lang=" + language + "#/" + this.state.urls
    }
    toggleDiv() {
        this.getRequest()
        if (this.state.language == true) {
            this.setState({
                language: false,
            });
        } else {
            this.setState({
                language: true,
            });
        }
    }
    render() {
        return (
            <header className="itrader-header">
                <div className='head-top'>
                    <img src={'/javascripts/app/images/banner.png'} />
                    <div className="head-language" data-language={this.state.slanguage} onClick={this.toggleDiv.bind(this)}>
                        <span className={this.getLanguage(this.state.slanguage).flag}></span>
                        <div className="toggle-lang" style={{ display: this.state.language ? false : 'none', marginTop: 10 }}>
                            {langs.map((item, index) => {
                                { if (item.id === this.state.slanguage) return }
                                return (<div key={index} data-language={item.id} onClick={this.selectLanguage.bind(this)}><span className={item.flag}></span>{item.name}</div>)
                            })}
                        </div>
                    </div>
                    <div className="head-logout" onClick={this.logoutbtn.bind(this)}>
                        <i className="fa fa-sign-out"></i>
                    </div>
                </div>
                <Dialog title={this.logoutModal.title} buttons={this.logoutModal.buttons} show={this.state.modalIsOpen}>
                    {messages.app_message_logout.text}
                </Dialog>
            </header>
        );
    }
};
