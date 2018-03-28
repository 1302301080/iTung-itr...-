const ITS = require('./its')
module.exports = class ITSAE extends ITS{
    initialize() {
        var user = getUser()
        var loadUserInfo = 'ITS|customquery|457|LoadUserInfo|13|{0}|74|LoadUserInfo|'.format(this.loginID)
        this.send(loadUserInfo)

        this.customQuery({ systemRef: Const.customQuery.loadUserInfo, user: this.loginID }, (errList, dataList) => {
            if (IsArray(dataList) && dataList.length > 0) {
                var record = dataList[0]
                if (record) {
                    user.name = record.row1
                    var userIdList = []
                    var userNameList = []
                    if (record.row2) {
                        userIdList = record.row2.split(',')
                    }
                    if (record.row3) {
                        userNameList = record.row3.split(',')
                    }
                    for (var i = 0; i < userIdList.length; i++) {
                        var id = userIdList[i].trim()
                        var name = ''
                        if (userNameList.length > i) {
                            name = userNameList[i].trim()
                        }
                        user.members[id] = { id: id, name: name, accounts: {} }
                    }
                }
            }

            var membersStr = '{0},{1}'.format(user.id, user.members.join(','))
            this.customQuery({ systemRef: Const.customQuery.LoadUserAccountID, user: membersStr }, (errList, dataList) => {
                if (IsArray(dataList)) {
                    for (var item of dataList) {
                        if (item.user && item.account) {
                            var aMemberUser = user.members[item.user]
                            if (aMemberUser) {
                                aMemberUser.accounts[item.account] = { id: item.account, name: item.name }
                            }
                        }
                    }
                }
            })
        })
        this.licenseControl()
        this.autoVerifySession()
        this.getFundOrderFromGBS()
    }
}