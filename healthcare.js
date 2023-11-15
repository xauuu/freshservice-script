ticket_id = $("#healthcare").data("ticket_id");
requested_item_id = $("#healthcare").data("requested_item_id");
ticket_state = $("#healthcare").data("ticket_state");
requester_id = $("#healthcare").data("requester_id");

//check tab
$(document).ready(function () {
    const tabs = ["information", "demands", "assessment", "finalize"];
    const app_code = "healthcare_pmo";
    const process_code = "healthcare_pmo_change_request";
    $.ajax({
        type: "GET",
        headers: authHeader,
        url: `https://trusisor.freshservice.com/api/v2/objects/27000052769/records?query=app_code%20%3A%20%27${app_code}%27%20AND%20process_code%20%3A%20%27${process_code}%27`,
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

columnsApproval = [
    {
        key: "no",
        text: "No"
    },
    {
        key: "process",
        text: "Process"
    },
    {
        key: "action_by",
        text: "Action By"
    },
    {
        key: "action_date",
        text: "Action Date",
        formatData: (ISOString) => {
            return formatDate(ISOString);
        }
    },
    {
        key: "comment",
        text: "Comment"
    }
];

//demands
$(document).ready(function () {
    try {
        var datatable = document.getElementById("datatable-demands-approval");
        $.ajax({
            type: "GET",
            headers: authHeader,
            url: `/api/v2/objects/27000052793/records?query=ticket_number%20%3A%20%27${ticket_id}%27`,
            dataType: "json",
            success: function (response) {
                const rows = response.records.map((item, index) => {
                    const data = item.data;
                    return {
                        ...data,
                        no: index + 1
                    };
                });
                if (rows.length > 0) {
                    datatable.columns = columnsApproval;
                    datatable.rows = rows;
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
});

// assessment
$(document).ready(function () {
    try {
        var datatable = document.getElementById("datatable-assessment-approval");
        $.ajax({
            type: "GET",
            headers: authHeader,
            url: `/api/v2/objects/27000052793/records?query=ticket_number%20%3A%20%27${ticket_id}%27`,
            dataType: "json",
            success: function (response) {
                const rows = response.records.map((item, index) => {
                    const data = item.data;
                    return {
                        ...data,
                        no: index + 1
                    };
                });
                if (rows.length > 0) {
                    datatable.columns = columnsApproval;
                    datatable.rows = rows;
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
});

// finalize
$(document).ready(function () {
    try {
        var datatable = document.getElementById("datatable-finalize-approval");
        $.ajax({
            type: "GET",
            headers: authHeader,
            url: `/api/v2/objects/27000052793/records?query=ticket_number%20%3A%20%27${ticket_id}%27`,
            dataType: "json",
            success: function (response) {
                const rows = response.records.map((item, index) => {
                    const data = item.data;
                    return {
                        ...data,
                        no: index + 1
                    };
                });
                if (rows.length > 0) {
                    datatable.columns = columnsApproval;
                    datatable.rows = rows;
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
});

$(document).ready(function () {
    const modal = document.querySelector("fw-modal#modal-healthcare");
    const modalTitle = document.querySelector("#modal-healthcare-title");
    const btnSave = document.querySelector("#btn-healthcare-save");
    const form = document.createElement("fw-form");
    const formContainer = document.querySelector("#healthcare-form-container");
    const btnEditDemand = document.querySelector("#btn-edit-demands");
    const btnEditAssessment = document.querySelector("#btn-edit-assessment");
    const btnEditFinalize = document.querySelector("#btn-edit-finalize");
    var requesters = [];
    $.ajax({
        type: "GET",
        headers: authHeader,
        url: `/api/v2/requesters`,
        dataType: "json",
        success: function (response) {
            requesters = response.requesters.map((item) => {
                return {
                    id: item.id,
                    value: `${item.first_name} ${item.last_name}`
                };
            });
        },
        error: function (err) {
            console.log("Error in get role: " + err);
        }
    });
    modal.addEventListener("fwClose", function () {
        form.formSchema = {};
    });
    btnEditDemand.addEventListener("click", async (e) => {
        e.preventDefault();
        const formSchema = {
            name: "Demand Form",
            fields: [
                {
                    name: "demands_gathering_assignee",
                    label: "Demands Gathering Assignee",
                    type: "DROPDOWN",
                    required: true,
                    placeholder: "Enter…",
                    choices: []
                },
                {
                    name: "demands",
                    label: "Demands",
                    type: "PARAGRAPH",
                    required: true,
                    placeholder: "Enter…"
                },
                {
                    name: "priority",
                    label: "Priority",
                    type: "PARAGRAPH",
                    required: true,
                    choices: [
                        {
                            value: "Low",
                            text: "Low",
                            position: 1
                        },
                        {
                            value: "Medium",
                            text: "Medium",
                            position: 2
                        },
                        {
                            value: "High",
                            text: "High",
                            position: 2
                        }
                    ]
                },
                {
                    name: "time_to_deploy",
                    label: "Time To Deploy",
                    type: "DATE",
                    required: true
                }
            ]
        };
        formContainer.prepend(form);
        form.formSchema = formSchema;
        await form.setFieldChoices("demands_gathering_assignee", requesters, {
            option_label_path: "value",
            option_value_path: "id"
        });
        modal.open();
    });
    btnEditAssessment.addEventListener("click", async (e) => {
        e.preventDefault();
        const formSchema = {
            name: "Demand Form",
            fields: [
                {
                    name: "assessment_assignee",
                    label: "Assessment Assignee",
                    type: "DROPDOWN",
                    required: true,
                    placeholder: "Enter…",
                    choices: []
                },
                {
                    name: "assessment",
                    label: "Assessment",
                    type: "PARAGRAPH",
                    required: true,
                    placeholder: "Enter…"
                }
            ]
        };
        formContainer.prepend(form);
        form.formSchema = formSchema;
        await form.setFieldChoices("assessment_assignee", requesters, {
            option_label_path: "value",
            option_value_path: "id"
        });
        modal.open();
    });
    btnEditFinalize.addEventListener("click", async (e) => {
        e.preventDefault();
        const formSchema = {
            name: "Finalize Form",
            fields: [
                {
                    name: "finalize_requirement_assignee",
                    label: "Finalize Requirement Assignee",
                    type: "DROPDOWN",
                    required: true,
                    placeholder: "Enter…",
                    choices: []
                },
                {
                    name: "demands",
                    label: "final_requirements",
                    type: "PARAGRAPH",
                    required: true,
                    placeholder: "Enter…"
                }
            ]
        };
        formContainer.prepend(form);
        form.formSchema = formSchema;
        await form.setFieldChoices("finalize_requirement_assignee", requesters, {
            option_label_path: "value",
            option_value_path: "id"
        });
        modal.open();
    });

    btnSave.addEventListener("click", async (e) => {
        const { values, isValid } = await form.doSubmit(e);
        console.log(values);
    });
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

function formatDate(date) {
    const today = new Date(date);
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    const formattedToday = dd + "-" + mm + "-" + yyyy;
    return formattedToday;
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
