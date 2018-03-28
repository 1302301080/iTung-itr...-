import React, { Component } from 'react';
import {
    Link
} from 'react-router';
import style from './nav.css';

export default class FootNav extends Component {
    constructor(props) {
        super(props)
        this.data = props.data
    }
    render() {
        return (
            <div className={this.props.className || 'menu-navitem'} onClick={this.props.onClick}>
                <Link className={this.props.status} to={this.props.link} >
                    {this.props.children}
                </Link>
            </div>
        );
    }
}