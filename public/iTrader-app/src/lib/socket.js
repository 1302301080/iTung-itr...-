import io from 'socket.io-client'
import util from './util'
import dataCenter from './data'

exports.initialize = function () {
    const socket = io()
    // socket.on('connect', function (socket) {
    socket.on('auth', function () {
        socket.emit('data', ['order', 'account', 'currency', 'spread', 'position','exchange'])
    })
    socket.on('data', function (data) {
        if (!data) return
        // if(data.exchange){
        //     console.log(data.exchange)
        // }
        // console.log(data)
        dataCenter.set(data)
    })
    socket.on('message', function (message) {
        if (message) {
            dataCenter.set({
                name: 'message',
                data: util.IsArray(message) ? message : [message]
            })
        }
    })

    socket.emit('auth')
}