function ShowDownTimeScheduleList() {

    CloseOpenedPopup();
    divDDOverlap.hide();
    divPageTitle.empty().append(NewHeadingWithClass('1', 'tab-title').text('Schedule Downtime')).show();
    
    let tabBodyContent = $.templates("#ScheduleDowntimeScreenTemplate").render();
    ShowCurrentTab(tabBodyContent);
    
    var divTabBody = $('#divScheduleDowntime');
    var table = divTabBody.find('table[name="tblScheduleDowntime"]');
    table.data('ColumnCount', 7);
    table.data('PageSize', 20);
    table.data('PageNumber', 0);
    var intPageNumber = table.data('PageNumber');
    
    CreateScheduleDowntimeTable(table, intPageNumber);
    function CreateScheduleDowntimeTable(table, pageNumber) {
        var columnCount = table.data('ColumnCount');
        var pageSize = table.data('PageSize');
        intPageNumber = pageNumber;
    
    
        GetHub().GetDownTimeSchedules(pageNumber).done(function (data) {
    
            var dataFormattingFunctions = {
                ConvertAndFormatUTCToLocal: ConvertAndFormatUTCToLocal,
                GetDowntimeScheduleStatus: GetDowntimeScheduleStatus
            };
    
            var tblScheduleDowntimeTableContent = $.templates('#ScheduleDowntimeTableRecordsTemplate').render(data.Records, dataFormattingFunctions, true);
            table.find('.linear-info-row').remove();
            table.append(tblScheduleDowntimeTableContent);
            var totalNumberOfPages = Math.ceil(data.TotalNumberOfRecords / pageSize);
            var navData = { ColumnCount: columnCount, CurrentPage: data.PageNumber + 1, TotalPages: totalNumberOfPages, NavID: 'tblScheduleDowntimeNav' };
            AddPaginationTemplate(table, CreateScheduleDowntimeTable, navData);
            var inputNote = divTabBody.find("input[name='Note']");
    
            inputNote.on('focus', function () {
                $(this).parents('tr').addClass('active');
            });
    
            inputNote.on('blur', function () {
                var currentTextField = $(this);
                var currentRowData = data.Records.filter(obj => {
                    return obj.SystemDowntimeSchedule_Id === $(this).parents('tr').data('id');
                });
                currentTextField.parents('tr').removeClass('active');
                SaveScheduleRow(currentTextField, currentRowData[0]);
            });
    
            divTabBody.find('.js-cancel-schedule').off().on('click', function () {
                var currentRowData = data.Records.filter(obj => {
                    return obj.SystemDowntimeSchedule_Id === $(this).parents('tr').data('id');
                });
                CancelSchedule(currentRowData[0], divTabBody);
            });
    
            divTabBody.find('.add-row').off().on('click', function () {
                AddNewSchedule(divTabBody);
            });
    
        });
    }
    
    function CancelSchedule(schedule, divtabbody) {
        var popupData = {
            'ScheduleStartOn': ConvertAndFormatUTCToLocal(schedule.ScheduleStartOn),
            'ScheduleEndOn': ConvertAndFormatUTCToLocal(schedule.ScheduleEndOn),
            'Note': schedule.Note
        };
        divtabbody.append($.templates("#ScheduleDowntimeCancelSchedulePopupTemplate").render(popupData));
    
        var popupBody = divtabbody.find('.popup');
        var popupOverlay = divtabbody.find('.overlay');
        var submitButton = divtabbody.find('button[name="submit-popup"]');
    
        $('.popup-close').on('click', function () {
            closeThisPopup();
        });
    
        submitButton.on('click', function () {
            GetHub().CancelDowntimeSchedule(schedule.SystemDowntimeSchedule_Id).done(function () {
                CreateScheduleDowntimeTable(table, intPageNumber);
            });
            closeThisPopup();
        });
    
        function closeThisPopup() {
            popupBody.remove();
            popupOverlay.remove();
        }
    }
    
    
    function AddNewSchedule(divtabbody) {
        divtabbody.append($.templates("#ScheduleDowntimeCreateShedulePopupTemplate").render());
        var popupBody = divtabbody.find('.popup');
        var popupOverlay = divtabbody.find('.overlay');
        var txtStartDate = divtabbody.find('input[name="ScheduleStartTime"]');
        var txtEndDate = divtabbody.find('input[name="ScheduleEndTime"]');
        var txtNote = divtabbody.find('textarea[name="Notes"]');
        var submitButton = divtabbody.find('button[name="submit-popup"]');
        var lblStartDate = txtStartDate.parents('label');
        var lblEndDate = txtEndDate.parents('label');
        var lblNote = txtNote.parents('label');
    
        txtStartDate.on('change', HandleStartDateChange).attr(MAX_LENGTH, 40);
        txtEndDate.on('change', HandleEndDateChange).attr(MAX_LENGTH, 40);
    
        lblStartDate.find('.calendar-form').on('click', OpenCalender);
        lblEndDate.find('.calendar-form').on('click', OpenCalender);
    
        $('.popup-close').on('click', function () {
            closeThisPopup();
        });
    
        submitButton.on('click', AddDowntimeSchedule);
        txtStartDate.focus();
    
        divtabbody.find('.calendar-container').on('click', function (event) {
            event.stopPropagation();
            event.preventDefault();
        });
    
        function HandleStartDateChange() {
            var strStartDate = DeepTrim(txtStartDate.val());
            var strError = DowntimeSchedule.ValidateStartDate(strStartDate);
            if (strError) {
                AddErrorInLabel(lblStartDate, strError);
            } else {
                var dtStartDate = ParseDateTime(strStartDate);
                var strStartDate = FormatDateTime(dtStartDate);
                txtStartDate.val(strStartDate);
                RemoveErrorFromLabel(lblStartDate);
            }
        }
    
        function HandleEndDateChange() {
            var strEndDate = DeepTrim(txtEndDate.val());
            var strError = DowntimeSchedule.ValidateEndDate(strEndDate);
            if (strError) {
                AddErrorInLabel(lblEndDate, strError);
            } else {
                var dtEndDate = ParseDateTime(strEndDate);
                strEndDate = FormatDateTime(dtEndDate);
                txtEndDate.val(strEndDate);
                RemoveErrorFromLabel(lblEndDate);
            }
        }
    
        function AddDowntimeSchedule() {
    
            var strStartDate = DeepTrim(txtStartDate.val());
            var strEndDate = DeepTrim(txtEndDate.val());
            var notes = txtNote.val();
    
            var controlInError;
    
            var strErrorInStartDate = DowntimeSchedule.ValidateStartDate(strStartDate);
            if (strErrorInStartDate) {
                AddErrorInLabel(lblStartDate, strErrorInStartDate);
                if (!controlInError) {
                    controlInError = txtStartDate;
                }
            } else {
                RemoveErrorFromLabel(lblStartDate);
            }
    
            var strErrorInEndDate = DowntimeSchedule.ValidateEndDate(strEndDate);
            if (strErrorInEndDate) {
                AddErrorInLabel(lblEndDate, strErrorInEndDate);
                if (!controlInError) {
                    controlInError = txtEndDate;
                }
            } else {
                RemoveErrorFromLabel(lblEndDate);
            }
    
            if (!strErrorInStartDate && !strErrorInEndDate) {
                var strErrorInSchedule = DowntimeSchedule.ValidateSchedule(strStartDate, strEndDate);
                if (strErrorInSchedule) {
                    AddErrorInLabel(lblEndDate, strErrorInSchedule);
                    if (!controlInError) {
                        controlInError = txtEndDate;
                    }
                } else {
                    RemoveErrorFromLabel(lblEndDate);
                }
            }
    
            if (!controlInError) {
    
                var dtStartDate = ConvertFromLocalToUTC(ParseDateTime(strStartDate));
                var dtEndDate = ConvertFromLocalToUTC(ParseDateTime(strEndDate));
    
                GetHub().AddDowntimeSchedule(dtStartDate, dtEndDate, notes).done(function () {
                    CreateScheduleDowntimeTable(table, intPageNumber);
                });
                closeThisPopup();
            }
            else {
                controlInError.focus();
            }
    
        }
    
        function closeThisPopup() {
            popupBody.remove();
            popupOverlay.remove();
        }
    
    }
    
    function SaveScheduleRow(inputNote, scheduleId) {
        var txtNote = inputNote;
        var strNote = txtNote.val();
        var objSchedule = scheduleId;
    
        if (objSchedule.SystemDowntimeSchedule_Id == -1) {
            return true;
        }
    
        GetHub().UpdateDowntimeSchedule(objSchedule.SystemDowntimeSchedule_Id, strNote);
        return true;
    }
    
    
    function GetDowntimeScheduleStatus(schedule) {
        if (schedule.IsCancelled)
            return 'Cancelled';
        if (CompareDateTime(schedule.ScheduleStartOn, schedule.CurrentUTCDate) > 0)
            return 'Scheduled';
        if (CompareDateTime(schedule.ScheduleStartOn, schedule.CurrentUTCDate) < 0 && CompareDateTime(schedule.ScheduleEndOn, schedule.CurrentUTCDate) > 0)
            return 'InProgress';
    
        return 'Executed';
    }
    
    
    var DowntimeSchedule = {
        ValidateStartDate: function (startDate) {
            if (IsNullOrEmpty(startDate)) {
                return 'Please enter start date.';
            }
    
            var dtStartDate = ParseDateTime(startDate);
            if (dtStartDate == null) {
                return 'Please enter valid start date.';
            }
            if (CompareDate(CurrentDate, dtStartDate) > 0) {
                return 'Start date can not be a past date.';
            }
            if (CompareDate(AddMonthsToDate(CurrentDate, 12), dtStartDate) < 0) {
                return 'Start date can not beyond 1 year.';
            }
            return null;
        },
        ValidateEndDate: function (endDate) {
            if (IsNullOrEmpty(endDate)) {
                return 'Please enter end date.';
            }
    
            var dtEndDate = ParseDateTime(endDate);
            if (dtEndDate == null) {
                return 'Please enter valid end date.';
            }
            if (CompareDate(CurrentDate, dtEndDate) > 0) {
                return 'End date can not be a past date.';
            }
            if (CompareDate(AddMonthsToDate(CurrentDate, 12), dtEndDate) < 0) {
                return 'End date can not beyond 1 year.';
            }
            return null;
        },
        ValidateSchedule: function (startDate, endDate) {
    
            var dtStartDate = ParseDateTime(startDate);
            var dtEndDate = ParseDateTime(endDate);
    
            if (CompareDate(dtStartDate, dtEndDate) > 0) {
                return 'End time should be after start time';
            }
            return null;
        }
    };

}
