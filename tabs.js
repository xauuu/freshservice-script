jQuery(document).ready(function () {
    const ticket_id = $("#tabs").data("ticket_id");
    const process_category_id = $("#tabs").data("process_category_id");
    const process_tabs_id = $("#tabs").data("process_tabs_id");

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

    function getData(url) {
        return $.ajax({
            url: url,
            type: "GET",
            headers: authHeader
        });
    }
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
