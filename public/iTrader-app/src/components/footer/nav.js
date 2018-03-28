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
            <div className={this.props.className || 'foot-navitem'} onClick={this.props.onClick}>
                <Link to={this.props.link} >
                    <img src={this.props.icon} className={'icon-footimg'} />
                    {this.props.children}
                </Link>
            </div>
        );
    }
}