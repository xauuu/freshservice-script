function getData(url) {
    return $.ajax({
        url: url,
        type: "GET",
        headers: authHeader
    });
}

jQuery(document).ready(function () {
    const ticket_id = $("#tabs-script").data("ticket_id");
    const process_category_id = $("#tabs-script").data("process_category_id");
    const process_tabs_id = $("#tabs-script").data("process_tabs_id");
    const requester_id = $("#tabs-script").data("requester_id");
    const ticket_state = $("#tabs-script").data("ticket_state");
    const process_state_id = $("#tabs-script").data("process_state_id");

    setTimeout(initChevron(), 300);

    function initChevron() {
        var container = jQuery("#chevron-container"),
            chevron_width = 0,
            list = container.find(".chevron-list"),
            leftpanel_width = container.closest(".detail-card-info").width(),
            wrapper = container.find(".chevron-scroll-wrapper");

        list.find("li")
            .each(function () {
                // Get all statuses width
                chevron_width = chevron_width + jQuery(this).width();
            })
            .end()
            .width(chevron_width);

        // Reset
        container.removeClass("inline-block");
        wrapper.removeAttr("style");

        // Show / Hide slide control
        if (chevron_width > leftpanel_width) {
            // Long chevron
            if (chevron_width > container.width() + 30) toggleChevronControls(true);
            else toggleChevronControls(false);

            if (chevron_width < container.width() - 60) {
                container.addClass("inline-block");
                if (chevron_width < leftpanel_width + 40) toggleChevronControls(false);
                else {
                    wrapper.width(leftpanel_width - 20);
                    toggleChevronControls(true);
                }
            }
        } else toggleChevronControls(false);
    }

    function toggleChevronControls(show) {
        if (show) {
            jQuery("#chevron-container").addClass("has-controls");
            jQuery(".chevron-controls").show();
        } else {
            jQuery("#chevron-container").removeClass("has-controls");
            jQuery(".chevron-controls").hide();
        }
    }

    function chevronControlState() {
        var wrapper = jQuery(".chevron-scroll-wrapper"),
            wrapper_scroll = wrapper.scrollLeft(),
            wrapper_width = wrapper.width(),
            list_width = wrapper.find(".chevron-list").width() + 25,
            left_control = jQuery("#chevron_control_left"),
            right_control = jQuery("#chevron_control_right");

        jQuery(".chevron-controls").removeClass("active disabled");
        if (wrapper_scroll == 0) {
            // Start
            left_control.removeClass("active");
        } else {
            left_control.addClass("active");
        }

        if (list_width == wrapper_scroll + wrapper_width) {
            // End
            right_control.removeClass("active");
        } else {
            right_control.addClass("active");
        }
    }

    jQuery(".chevron-controls").click(function () {
        var wrapper = jQuery(".chevron-scroll-wrapper"),
            _this = jQuery(this);

        _this.addClass("disabled"); // Prevent multiple clicks

        jQuery(".chevron-scroll-wrapper, .chevron-list").animate(
            {
                scrollLeft: wrapper.scrollLeft() + (-wrapper.width() + 300) * (_this.attr("id") == "chevron_control_left" ? 1 : -1) * 1
            },
            500,
            function () {
                chevronControlState();
            }
        );
    });

    var resizeListener;
    jQuery(window).resize(function () {
        clearTimeout(resizeListener);
        resizeListener = setTimeout(initChevron(), 300);
    });

    $(".chevron-list").on("click", ".custom-tab-item", function (e) {
        if ($(this).attr("disabled")) return;

        $(this).addClass("active").siblings().removeClass("active");

        $($(this).data("tab")).addClass("active").siblings().removeClass("active");
    });

    function insertTab(data) {
        var newLi = $("<li>", {
            class: "custom-tab-item",
            "data-tab": `#${data.tab_code}`
        });

        var divInsideLi = $("<div>", {
            "data-ellipsis": "true",
            style: "overflow: visible",
            text: data.tab_name
        });
        newLi.append(divInsideLi);
        $("#tabList li:eq(0)").after(newLi);
        initChevron();
    }

    async function initTabContent(data, permission) {
        const fields = JSON.parse(data.fields);
        const response = await getData(`/api/v2/objects/${data.custom_object_id}/records?query=ticket_id : '${ticket_id}'`);
        const records = response.records;

        const section = $("<section>", {
            class: "custom-tab-content",
            id: data.tab_code
        });

        const heading = $("<div>", {
            class: "itil-content-title"
        });
        heading.html(data.tab_name);
        section.append(heading);

        if (Boolean(data.is_table)) {
            const buttonContainer = $("<div>", { id: "button-tab" });
            const buttonAdd = $("<fw-button>", {
                "modal-trigger-id": `modal-${data.tab_code}`
            });
            buttonAdd.text("Add New");
            buttonContainer.append(buttonAdd);

            if (permission.can_edit) {
                const buttonSubmit = $("<fw-button>", {
                    id: `submit-${data.tab_code}`
                });
                buttonSubmit.text("Submit");
                buttonSubmit.on("click", function () {
                    $.ajax({
                        type: "PUT",
                        url: `/api/v2/tickets/${ticket_id}`,
                        data: JSON.stringify({ custom_fields: { ticket_state: 1 } }),
                        headers: authHeader,
                        success: async function () {
                            showNotification("success", "Submitted request successfully");
                            window.location.reload(true);
                        }
                    });
                });
                $("#button-bottom").append(buttonSubmit);
            }

            const datatable = document.createElement("fw-data-table");
            datatable.columns = transformSchema(fields)?.map((item) => ({ text: item.label, key: item.name }));
            datatable.rows = transformData(records);
            if (permission.can_edit)
                var editAction = {
                    name: "Edit",
                    handler: (rowData) => {
                        console.log(rowData);
                        document.getElementById(`form-${data.tab_code}`).setFieldsValue(rowData);
                        document.getElementById(`modal-${data.tab_code}`).open();
                    },
                    graphicsProps: { name: "edit" }
                };
            if (permission.can_delete)
                var deleteAction = {
                    name: "Delete",
                    handler: (rowData) => {
                        $.ajax({
                            type: "DELETE",
                            headers: authHeader,
                            url: `/api/v2/objects/${data.custom_object_id}/records/${rowData.bo_display_id}`,
                            success: function () {
                                datatable.rows = datatable.rows.filter((row) => row.bo_display_id !== rowData.bo_display_id);
                            }
                        });
                    },
                    graphicsProps: { name: "delete" }
                };
            datatable.rowActions = [editAction, deleteAction];

            initModal(
                data,
                {
                    name: data.tab_code,
                    fields: fields?.map((item) => ({ ...item, type: getType(item.type) }))
                },
                datatable
            );

            section.append(buttonContainer, datatable);
        } else {
            const form = document.createElement("fw-form");
            section.prepend(form);
            form.formSchema = {
                name: data.tab_code,
                fields: transformSchema(fields)?.map((item) => ({ ...item, type: getType(item.type, false), readonly: true }))
            };
            form.initialValues = transformData(records)[0];
        }

        $("#sr-detail").append(section);
    }

    async function checkRole(requester_id, tabConfig) {
        const [requesters] = await Promise.all([getMemberRequesterGroup(tabConfig.requester_groups_id)]);
        if ([...requesters].includes(requester_id)) return true;
        return false;
    }

    getData(`/api/v2/tickets/${ticket_id}/requested_items`).then(async (response) => {
        const requestedItem = response.requested_items[0];
        const [tabResponse, permission] = await Promise.all([
            getData(`/api/v2/objects/${process_tabs_id}/records?query=service_item_id : '${requestedItem.service_item_id}'`),
            getData(`/api/v2/objects/${process_state_id}/records?query=service_item_id : '${requestedItem.service_item_id}' AND state : '${ticket_state}'`)
        ]);
        tabResponse?.records.forEach(async (item) => {
            const visible = await checkRole(requester_id, permission.data);
            if (visible && permission.data.can_view) {
                insertTab(item.data);
                initTabContent(item.data, permission.data);
            }
        });
    });

    async function getMemberRequesterGroup(groups) {
        if (!groups) return [];
        const result = [];
        await Promise.all(
            groups.split(";")?.map(async (item) => {
                const res = await getData(`/api/v2/requester_groups/${item}/members`);
                result.push(...res.requesters?.map((item) => item.id));
            })
        );

        return result;
    }

    function initModal(tabConfig, formSchema, datatable) {
        const modal = $("<fw-modal>", {
            id: `modal-${tabConfig.tab_code}`,
            slider: "true",
            "title-text": tabConfig.tab_name,
            "submit-text": "Save "
        });

        const formContainer = document.createElement("div");
        const form = document.createElement("fw-form");
        form.id = `form-${tabConfig.tab_code}`;
        modal.append(formContainer);
        form.formSchema = formSchema;
        formContainer.prepend(form);
        handleDropdown(form, formSchema.fields);
        $("body").append(modal);

        modal.on("fwClose", function (e) {
            form.doReset(e);
        });

        modal.on("fwSubmit", async function (e) {
            const { values } = await form.doSubmit();
            let ajaxConfig = {
                type: "POST",
                url: `/api/v2/objects/${tabConfig.custom_object_id}/records`
            };

            if (values.bo_display_id) {
                ajaxConfig = {
                    type: "PUT",
                    url: `/api/v2/objects/${tabConfig.custom_object_id}/records/${values.bo_display_id}`
                };
            }

            $.ajax({
                type: ajaxConfig.type,
                url: ajaxConfig.url,
                data: JSON.stringify({ data: { ...values, ticket_id: String(ticket_id) } }),
                headers: authHeader,
                success: async function () {
                    const responseGetData = await getData(`/api/v2/objects/${tabConfig.custom_object_id}/records?query=ticket_id : '${ticket_id}'`);
                    const records = responseGetData.records;
                    datatable.rows = transformData(records);
                    showNotification("success", !values.bo_display_id ? "Create new successfully" : "Updated successfully");
                    form.doReset(e);
                    modal[0].close();
                }
            });
        });
    }

    function getType(type, isTable = true) {
        if (type === "lookup") return isTable ? "DROPDOWN" : "TEXT";
        return type?.toUpperCase();
    }

    function handleDropdown(form, fields) {
        const dropdowns = fields.filter((item) => item.type === "DROPDOWN");
        dropdowns.forEach(async (dropdown) => {
            const id = dropdown.label.split(" ").pop();
            if (!isNaN(id)) {
                const res = await getData(`/api/v2/objects/${id}/records`);
                if (res.records && res.records.length > 0) {
                    generateDropdown(dropdown.name, form, res.records);
                }
            }
        });
    }

    function generateDropdown(container, form, list) {
        try {
            const options = list.map((item) => item.data);
            form.setFieldChoices(container, options, {
                option_label_path: "display_name",
                option_value_path: "bo_display_id"
            });
            form.addEventListener("fwFormValueChanged", (e) => {
                const { field, value } = e.detail;
                if (field == container && value) {
                    form.setFieldValue(container + "_value", list.find((item) => item.data.bo_display_id == value).data.display_name);
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    function transformData(records) {
        return records.map((record) => {
            const recordData = record.data;
            delete recordData.bo_created_by;
            delete recordData.bo_updated_by;
            Object.keys(recordData).forEach((field) => {
                const fieldValue = recordData[field];

                if (fieldValue && fieldValue.id && fieldValue.value) {
                    recordData[field] = fieldValue.id;
                    recordData[field + "_value"] = fieldValue.value;
                }
            });

            return recordData;
        });
    }

    function transformSchema(formSchema) {
        return formSchema.map((item) => {
            if (item.type === "lookup") {
                return { ...item, name: `${item.name}_value`, label: item.label.replace(/\d+$/, "").trim() };
            }

            return item;
        });
    }

    function showNotification(type = "success", content) {
        document.querySelector("#type_toast_right").trigger({ type, content });
    }
});

$(document).ready(function () {
    const ticket_id = $("#tabs-script").data("ticket_id");
    const process_logs_id = $("#tabs-script").data("process_logs_id");

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
            text: "Comment",
            widthProperties: {
                width: "400px"
            }
        }
    ];
    function formatDate(date) {
        const today = new Date(date);
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        let hh = today.getHours();
        let min = today.getMinutes();

        if (dd < 10) dd = "0" + dd;
        if (mm < 10) mm = "0" + mm;
        if (hh < 10) hh = "0" + hh;
        if (min < 10) min = "0" + min;

        const formattedToday = dd + "/" + mm + "/" + yyyy + ", " + hh + ":" + min;
        return formattedToday;
    }
    try {
        var datatable = document.getElementById("datatable-activity-logs");
        getData(`/api/v2/objects/${process_logs_id}/records?query=ticket_number%20%3A%20%27${ticket_id}%27`).then(async (response) => {
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
        });
    } catch (error) {
        console.error(error);
    }
});
