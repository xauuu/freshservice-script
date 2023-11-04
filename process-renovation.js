ticket_id = $("#process-renovation").data("ticket_id");
requested_item_id = $("#process-renovation").data("requested_item_id");
ticket_state = $("#process-renovation").data("ticket_state");
requester_id = $("#process-renovation").data("requester_id");

$(document).ready(function () {
    const tabs = ["information", "planning", "awaiting-approval", "implement", "payment"];
    $.ajax({
        type: "GET",
        headers: authHeader,
        url: "https://trusisor.freshservice.com/api/v2/objects/27000052769/records?query=app_code%20%3A%20%27retail%27%20AND%20process_code%20%3A%20%27renovation%27",
        dataType: "json",
        success: function (response) {
            getGroup(response.records);
        },
        error: function (err) {
            console.log("Error in get role: " + err);
        }
    });

    async function getGroup(list) {
        for (let i = 0; i < list.length; i++) {
            const element = list[i];
            const { data } = element;
            try {
                const fetch = await $.ajax({
                    type: "GET",
                    headers: authHeader,
                    url: `https://trusisor.freshservice.com/api/v2/requester_groups/${data.group}/members`,
                    dataType: "json"
                });

                if (fetch.requesters.some((requester) => requester.id === requester_id)) {
                    const views = data.views.split(";");
                    checkTab(views);
                    return;
                }
            } catch (error) {
                console.log("Error in get group: " + error);
            }
        }
    }

    function checkTab(views) {
        const activeTab = tabs[ticket_state];
        views.forEach((view) => {
            if (tabs.includes(view)) {
                const item = $(`li.custom-tab-item[data-tab="#${view}"]`);
                item.removeClass("muted").removeAttr("disabled");
                if (view == activeTab) {
                    item.addClass("active").siblings().removeClass("active");
                    $(`#${view}`).addClass("active").siblings().removeClass("active");
                }
            }
        });
    }
});

$(document).ready(function () {
    var modal = document.querySelector("fw-modal#modal-contractor");
    var buttonSubmit = document.querySelector("#contractor-submit");
    var vendors = document.getElementById("vendors");
    vendors.search = (value, source) => {
        return fetch("https://trusisor.freshservice.com/api/v2/vendors", {
            method: "GET",
            headers: authHeader
        })
            .then((resp) => resp.json())
            .then((data) => {
                const result = data.vendors.filter((x) => convertViToEn(x.name).includes(convertViToEn(value)));
                return result.map((x) => {
                    return {
                        text: x.name,
                        subText: x.email,
                        value: x.email
                    };
                });
            });
    };
    if (ticket_state == 0) {
        buttonSubmit.addEventListener("click", async (e) => {
            const values = await vendors.getSelectedItem();
            const resultObject = {};

            values.forEach((item, index) => {
                resultObject[`vendor_${index + 1}_email`] = item.value;
            });
            console.log(resultObject);
            jQuery.ajax({
                url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
                type: "PUT",
                headers: authHeader,
                data: JSON.stringify({
                    custom_fields: resultObject
                }),
                success: function (data) {
                    jQuery.ajax({
                        url: `/api/v2/tickets/${ticket_id}`,
                        type: "PUT",
                        headers: authHeader,
                        data: JSON.stringify({
                            custom_fields: { ticket_state: 1 }
                        }),
                        success: function (data) {
                            document.querySelector("#type_toast_right").trigger({ type: "success", content: "Lập hồ sơ mời thầu thành công" });
                            modal.close();
                        },
                        error: function (err) {
                            console.log("Error in update ticket: " + err);
                        }
                    });
                },
                error: function (err) {
                    console.log("Error in update ticket: " + err);
                }
            });
        });
    }
    if (ticket_state == 1) {
        var form = document.querySelector("#form-response");
        document.querySelector("#response-submit").addEventListener("click", async (e) => {
            const { values, isValid } = await form.doSubmit(e);
            jQuery.ajax({
                url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
                type: "PUT",
                headers: authHeader,
                data: JSON.stringify({
                    custom_fields: values
                }),
                success: function (data) {
                    document.querySelector("#type_toast_right").trigger({ type: "success", content: "Cập nhật phan hồi của nhà thầu thành công" });
                    modal.close();
                },
                error: function (err) {
                    console.log("Error in update ticket: " + err);
                }
            });
        });
        document.querySelector("#confirm-submit").addEventListener("click", async (e) => {
            const { values, isValid } = await form.doSubmit(e);
            jQuery.ajax({
                url: `/api/v2/tickets/${ticket_id}`,
                type: "PUT",
                headers: authHeader,
                data: JSON.stringify({
                    custom_fields: { ticket_state: 2 }
                }),
                success: function (data) {
                    document.querySelector("#type_toast_right").trigger({ type: "success", content: "Xác nhận phản hồi của nhà thầu thành công" });
                    modal.close();
                },
                error: function (err) {
                    console.log("Error in update ticket: " + err);
                }
            });
        });
    }

    if (ticket_state == 2) {
        var inputs = document.querySelectorAll('input[name="email_contractor"]');
        var formatted_values = [];

        inputs.forEach(function (input) {
            var value = input.value;
            var email_contractor = { value: value, text: value };
            formatted_values.push(email_contractor);
        });
        document.querySelector("#email_selected_contractor").options = formatted_values;
        document.querySelector("#selected-submit").addEventListener("click", async (e) => {
            const values = await document.querySelector("#email_selected_contractor").getSelectedItem();
            const email_selected_contractor = values[0]?.value;
            jQuery.ajax({
                url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
                type: "PUT",
                headers: authHeader,
                data: JSON.stringify({
                    custom_fields: { email_selected_contractor }
                }),
                success: function (data) {
                    jQuery.ajax({
                        url: `/api/v2/tickets/${ticket_id}`,
                        type: "PUT",
                        headers: authHeader,
                        data: JSON.stringify({
                            custom_fields: { ticket_state: 3 }
                        }),
                        success: function (data) {
                            document.querySelector("#type_toast_right").trigger({ type: "success", content: "Chọn nhà thầu chính thức thành công" });
                            modal.close();
                        },
                        error: function (err) {
                            console.log("Error in update ticket: " + err);
                        }
                    });
                },
                error: function (err) {
                    console.log("Error in update ticket: " + err);
                }
            });
        });
    }
});

$(document).ready(function () {
    var modal = document.querySelector("fw-modal#modal-ground");
    if (ticket_state == 0) {
        var form = document.querySelector("#form-ground");
        var buttonSubmit = document.querySelector("#submit");
        buttonSubmit.addEventListener("click", async (e) => {
            const { values, isValid } = await form.doSubmit(e);
            jQuery.ajax({
                url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
                type: "PUT",
                headers: authHeader,
                data: JSON.stringify({
                    custom_fields: values
                }),
                success: function (data) {
                    jQuery.ajax({
                        url: `/api/v2/tickets/${ticket_id}`,
                        type: "PUT",
                        headers: authHeader,
                        data: JSON.stringify({
                            custom_fields: { ticket_state: 1 }
                        }),
                        success: function (data) {
                            document.querySelector("#type_toast_right").trigger({ type: "success", content: "Lập kế hoạch thành công" });
                            modal.close();
                        },
                        error: function (err) {
                            console.log("Error in update ticket: " + err);
                        }
                    });
                },
                error: function (err) {
                    console.log("Error in update ticket: " + err);
                }
            });
        });
    }

    if (ticket_state == 3) {
        var upload = document.querySelector("#contract-upload");
        document.querySelector("#upload-submit").addEventListener("click", async (e) => {
            const values = await upload.getFiles();
            console.log(values[0].file);
            var formData = new FormData();
            formData.append("attachments[]", values[0].file);
            jQuery.ajax({
                url: `/api/v2/tickets/${ticket_id}`,
                type: "PUT",
                headers: authHeaderNotCT,
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    window.location.reload(true);
                    document.querySelector("#type_toast_right").trigger({ type: "success", content: "Tải hợp đồng lên thành công" });
                    upload.reset();
                },
                error: function (err) {
                    document.querySelector("#type_toast_right").trigger({ type: "error", content: "Có lỗi xảy ra" });
                    console.log("Error in update ticket: " + err);
                }
            });
        });
    }
});

columnsApproval = [
    {
        key: "stt",
        text: "STT",
        position: 1
    },
    {
        key: "approver",
        text: "Người duyệt",
        position: 2
    },
    {
        key: "sent-date",
        text: "Ngày gửi",
        position: 3
    },
    {
        key: "approval-date",
        text: "Ngày duyệt",
        position: 4
    },
    {
        key: "status",
        text: "Trạng thái",
        position: 5
    },
    {
        key: "notes",
        text: "Ý kiến",
        position: 6
    }
];
//planning

$(document).ready(function () {
    var datatableApproval = document.getElementById("datatable-planning-approval");
    datatableApproval.columns = columnsApproval;
    const inputData = $("data-planning-approval").val();
    datatableApproval.rows = JSON.parse(inputData);
});

// Contractor
$(document).ready(function () {
    var datatable = document.getElementById("datatable-contractor"),
        datatableApproval = document.getElementById("datatable-contractor-approval");

    const columns = [
        {
            key: "stt",
            text: "STT",
            position: 1
        },
        {
            key: "contrator",
            text: "Nhà thầu",
            position: 2
        },
        {
            key: "price",
            text: "Báo giá",
            position: 3
        },
        {
            key: "notes",
            text: "Ghi chú",
            position: 4
        }
    ];

    datatable.columns = columns;
    const inputData = $("data-contractor").val();
    datatable.rows = JSON.parse(inputData);

    datatableApproval.columns = columnsApproval;
    const inputDataA = $("data-contractor-approval").val();
    datatableApproval.rows = JSON.parse(inputDataA);
});

// implement
$(document).ready(function () {
    var datatable = document.getElementById("datatable-implement");

    const columns = [
        {
            key: "stt",
            text: "STT",
            position: 1
        },
        {
            key: "category",
            text: "Hạng mục",
            position: 2
        },
        {
            key: "start",
            text: "Bắt đầu",
            position: 3
        },
        {
            key: "end",
            text: "Kết thúc",
            position: 4
        },
        {
            key: "status",
            text: "Trạng thái",
            position: 5
        },
        {
            key: "notes",
            text: "Ghi chú",
            position: 6
        }
    ];

    datatable.columns = columns;
    const inputData = $("data-implement").val();
    datatable.rows = JSON.parse(inputData);
});

// payment
$(document).ready(function () {
    var datatable = document.getElementById("datatable-payment");

    const columns = [
        {
            key: "stt",
            text: "STT",
            position: 1
        },
        {
            key: "category",
            text: "Hạng mục",
            position: 2
        },
        {
            key: "date",
            text: "Thời gian",
            position: 3
        },
        {
            key: "price",
            text: "Giá trị",
            position: 4
        },
        {
            key: "status",
            text: "Trạng thái",
            position: 5
        },
        {
            key: "notes",
            text: "Ghi chú",
            position: 6
        }
    ];

    datatable.columns = columns;
    const inputData = $("data-payment").val();
    datatable.rows = JSON.parse(inputData);
});

function convertViToEn(str, toUpperCase = false) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");

    return toUpperCase ? str.toUpperCase() : str;
}
