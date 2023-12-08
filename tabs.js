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

    async function initTabContent(related_custom_object, data) {
        const fields = JSON.parse(data.fields);
        getData(`/api/v2/objects/${related_custom_object}/records?query=ticket_id : '${ticket_id}'`).then(async (response) => {
            const records = response.records;
            if (Boolean(data.is_table)) {
                const section = $("<section>", {
                    class: "custom-tab-content",
                    id: data.tab_code
                });
                var datatable = document.createElement("fw-data-table");
                datatable.columns = fields?.map(function (item) {
                    return { text: item.label, key: item.name };
                });
                datatable.rows = records?.map((item) => item.data);
                section.append(datatable);
                $("#sr-detail").append(section);
            } else {
                const section = $("<section>", {
                    class: "custom-tab-content",
                    id: data.tab_code
                });
                var form = document.createElement("fw-form");
                section.prepend(form);
                form.formSchema = {
                    name: data.tab_code,
                    fields: fields?.map(function (item) {
                        return { ...item, type: item.type.toUpperCase(), readonly: true };
                    })
                };
                form.initialValues = records[0]?.data;

                $("#sr-detail").append(section);
            }
        });
    }

    getData(`/api/v2/tickets/${ticket_id}/requested_items`).then(async (response) => {
        const requestedItem = response.requested_items[0];
        const [categoryResponse, tabResponse] = await Promise.all([
            getData(`/api/v2/objects/${process_category_id}/records?query=service_item_id : '${requestedItem.service_item_id}'`),
            getData(`/api/v2/objects/${process_tabs_id}/records?query=service_item_id : '${requestedItem.service_item_id}'`)
        ]);
        tabResponse?.records.forEach((item) => {
            insertTab(item.data);
            initTabContent(categoryResponse.records[0]?.data.related_custom_object, item.data);
        });
    });
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
