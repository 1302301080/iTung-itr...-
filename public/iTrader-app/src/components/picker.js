import React, { Component, PropTypes } from 'react';
import MobilePicker from 'react-mobile-picker';

export default class Picker extends Component {
    constructor(props) {
        super(props);
        this.sourceData = this.props.source
        this.name = this.props.name
        this.pickerValue = {}
        this.state = {
            disabled: 'all',
            inpClass: '',
            isPickerShow: false,
            valueGroups: {
                title: this.props.source.valueList[0],//valueList[0]
                label: this.props.source.title
            },
            optionGroups: {
                title: this.props.source.valueList
            }
        };
        this.handleChange = this.handleChange.bind(this);
        this.togglePicker = this.togglePicker.bind(this);
        this.getpicketinp = this.getpicketinp.bind(this);
    }


    // handleChange(name, value) {
    //     this.setState(function (x) {
    //         var valueGroups = x.valueGroups;
    //         return {
    //             valueGroups: {
    //                 valueGroups: valueGroups,
    //                 [name]: value
    //             }
    //         }
    //     });
    // };

    handleChange(name, value) {
        this.setState(({ valueGroups }) => ({
            valueGroups: {
                ...valueGroups,
                [name]: value
            }
        }));
    };
    togglePicker() {
        this.setState({
            valueGroups: {
                title: this.props.source.valueList[0],//valueList[0]
                label: this.sourceData.title
            },
            optionGroups: {
                title: this.props.source.valueList
            }
        })
        this.setState(({ isPickerShow }) => ({
            isPickerShow: !isPickerShow
        }));
    };
    getpicketinp(e) {
        if (this.props.onSelect) {
            var value = this.refs.pickerinp.value
            var index = this.props.source.valueList.indexOf(value)
            this.props.onSelect(e, this.name, { key: this.props.source.optionList[index], value: value })
        }
        var inpType = this.props.source.optionList[index]
        // if (this.props && this.props.name == 'order-type') {
        //     if (inpType == 'stopLimit') {
        //         this.setState({
        //             inpClass: 'inpselectType'
        //         })
        //     } else {
        //         this.setState({
        //             inpClass: ''
        //         })
        //     }
        // }
        this.setState(({ isPickerShow }) => ({
            isPickerShow: !isPickerShow
        }));
    }

    render() {
        const { isPickerShow, optionGroups, valueGroups, inpClass } = this.state;
        const maskStyle = {
            display: isPickerShow ? 'block' : 'none'
        };
        const pickerModalClass = `picker-modal${isPickerShow ? ' picker-modal-toggle' : ''}`;
        return (
            <div className="example-container">
                <div className="from-type-item border-bottom-1px">
                    <label className="itrader-color">{valueGroups.label}</label>
                    <div className={inpClass + " from-searchInp"}>
                        <input
                            type="text"
                            className="itrader-color text-TypeTIF-right"
                            ref='pickerinp'
                            value={valueGroups.title}
                            readOnly
                            onClick={this.togglePicker} />
                        <div className="act-headr">
                            <i className="itrader-color fa fa-chevron-right" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>
                <div className="picker-modal-container">
                    <div
                        className="picker-modal-mask"
                        style={maskStyle}
                        onClick={this.togglePicker}></div>
                    <div className={pickerModalClass}>
                        <div className="picker-btns">
                            <div className="picker-btnNo" onClick={this.togglePicker}>{messages.app_btn_cancel.text}</div>
                            <div className="picker-btnYes" onClick={this.getpicketinp}>{messages.app_btn_sure.text}</div>
                        </div>
                        <MobilePicker
                            optionGroups={optionGroups}
                            valueGroups={valueGroups}
                            onChange={this.handleChange} />
                    </div>
                </div>
            </div>
        );
    }
}