import React, { Component } from 'react';
import {
    Link,
} from 'react-router';
import Nav from './nav';
import style from './nav.css';
import util from '../../lib/util'
import LayoutConfig from '../../config/layout.config';

export default class MenuNav extends Component {
    constructor(props) {
        super(props);
        var sessionLayoutData = util.getSessionStorage("layout", true) || {}
        this.state = {
            activeIndex: sessionLayoutData.navIndex || 0
        }
    }
    handleClick(index) {
        util.setSessionStorage('layout', { navIndex: index }, {type: 'update'})
        this.setState({
            activeIndex: index,
        });
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(index)
        }
    }
    render() {
        var sessionLayoutData = util.getSessionStorage("layout", true) || {}
        this.state.activeIndex = sessionLayoutData.navIndex || 0
        var that = this
        var menuNav = LayoutConfig.page.list.map(function (v, index) {
            return (
                <Nav
                    key={index}
                    onClick={that.handleClick.bind(that, index)}
                    className={that.state.activeIndex === index ? 'menu-navitem menu-active' : null}
                    link={v.link}>
                    {v.title}
                </Nav>
            );
        });
        return (
            <div className="menu-nav border-top-1px">
                {menuNav}
            </div>
        );
    }
}
