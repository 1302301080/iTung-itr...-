function CashTransferChanged(){var a=AccountMgr.get($("#cash-transfer-account-out").val(),$("#cash-transfer-currency").val());$("#cash-transfer-available-amount").text(""),$("#cash-transfer-available-amount").text($._format.amount(a?a[tags.cashBalance]:0)),cash_transfer_form.translate()}function InitializeCashTransfer(){cash_transfer_form=$("#cash-transfer-form"),$("#cash-transfer-currency").change(function(){CashTransferChanged()}),$("#cash-transfer-account-out").change(function(){CashTransferChanged()})}function TransferCash(){showMessage({title:messages.cash_transfer_title.text,load:{url:"/iTrader/account/transfer",callback:function(){InitializeCashTransfer(),CashTransferChanged()}},buttonNameList:["submit","reset"],callback:function(a,b){if("submit"===a.name){if(validateForm(cash_transfer_form,{submitHandler:function(a){$.ajax({type:"post",url:"/iTrader/account/transfer",data:cash_transfer_form.serialize(),success:function(a){a.error?handleError(a.error):alertMessage({message:messages.cash_transfer_success_message.text})},error:handleError})},validClass:""}),cash_transfer_form.valid())if(a.text()===messages.btn_submit.text){a.text(messages.btn_sure.text),$("#cash-transfer-form .alert").removeClass("hidden"),$("#cash-transfer-form :input").attr("disabled","disabled");var c=b.getButton("btn-reset");c&&c.length>0&&c.text(messages.btn_cancel.text)}else a.text()===messages.btn_sure.text&&($("#cash-transfer-form .hidden").remove(),$("#cash-transfer-form :input").removeAttr("disabled"),cash_transfer_form.submit(),b.close())}else if("reset"===a.name)if(a.text()===messages.btn_reset.text)document.getElementById("cash-transfer-form").reset(),cash_transfer_form.find(".has-success, .has-error").each(function(){$(this).removeClass("has-success").removeClass("has-error")});else if(a.text()===messages.btn_cancel.text){$("#cash-transfer-form .alert").addClass("hidden"),$("#cash-transfer-form :input").removeAttr("disabled"),a.text(messages.btn_reset.text);var d=b.getButton("btn-submit");d&&d.length>0&&d.text(messages.btn_submit.text)}}})}var cash_transfer_form;