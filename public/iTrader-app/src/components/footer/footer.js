import React, { Component } from 'react';
import {
  Link,
} from 'react-router';
import Nav from './nav';
import style from './nav.css';
import util from '../../lib/util'
import LayoutConfig from '../../config/layout.config';


export default class Footer extends Component {
    constructor(props) {
        var sessionTradeData = util.getSessionStorage("layout", true) || {}
        super(props);
        this.state = {
            activeIndex: sessionTradeData.layoutTabs || 0
        }
    }
    handleClick(index) {
        util.setSessionStorage('layout', { layoutTabs: index }, {type: 'update'})
        this.setState({
            activeIndex: index,
        });
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(index)
        }
    }
    render() {
        var sessionLayoutData = util.getSessionStorage("layout", true) || {}
        this.state.activeIndex = sessionLayoutData.layoutTabs || 0

        var that = this
        var footerNav = LayoutConfig.tabbar.list.map(function (v, index) {
            return (
                <Nav
                    key={index}
                    onClick={ that.handleClick.bind(that, index) }
                    className={that.state.activeIndex === index ? 'foot-navitem foot-active' : null}
                    icon={v.icon}
                    link={v.link}>
                    <span className="">{v.title}</span>
                </Nav>
            );
        });
        return (
            <footer className="footer footer-shadow">
                {footerNav}
            </footer>
        );
    }
}
