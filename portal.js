$(document).ready(function () {
    var lang = document.documentElement.lang || "en";
    var site = localStorage.getItem("site") || "";
    var workspaces = $("#portal-script").data("workspaces") || [];
    var workspace_id = workspaces
        ? Object.keys(workspaces).find(function (k) {
              return workspaces[k]?.toLowerCase() === site?.toLowerCase();
          })
        : null;

    var modal = $(".modal-container");
    var close = $(".close");

    close.click(function () {
        modal.hide();
    });

    $(document).ready(function () {
        var appList = [];
        var processList = [];
        document.getElementById("sr-search").addEventListener("input", (e) => {
            const activeApp = $("input[name=app_code]").val();
            const keyword = e.currentTarget.value.toLowerCase();
            if (!keyword) {
                renderProcess(processList);
                return;
            }
            const filteredProcesses = processList.filter(function (item) {
                const processName = item.data.process_name.toLowerCase();
                const appCode = item.data.app_code;

                return processName.includes(keyword) && appCode.includes(activeApp);
            });

            renderProcess(filteredProcesses);
        });
        const param = workspace_id ? `workspace_id%20%3A%20%27${workspace_id}%27%20AND%20` : "";
        jQuery.ajax({
            type: "GET",
            url: `/api/v2/objects/27000052210/records?query=${param}is_active%20%3A%20%271%27`,
            dataType: "json",
            headers: authHeader,
            success: function (response) {
                appList = getUniqueAppInfo(response.records);
                processList = response.records;
                renderApp(appList);
            }
        });

        function getUniqueAppInfo(jsonData) {
            const uniqueAppInfo = new Map();

            jsonData.forEach((record) => {
                const { app_code, app_name, app_image, app_description } = record.data;

                const key = `${app_code}-${app_name}`;
                if (app_description) {
                    uniqueAppInfo.set(key, { app_code, app_name, app_image, app_description });
                } else if (!uniqueAppInfo.has(key)) {
                    uniqueAppInfo.set(key, { app_code, app_name, app_image: "", app_description });
                }
            });
            const result = Array.from(uniqueAppInfo.values());
            return result;
        }

        function renderApp(list) {
            let html = "";
            jQuery.map(list, function (item, index) {
                const { app_name, app_code, app_description } = item;
                html += `<div class="item" data-app="${app_code}" data-title="${app_name}">
                                <div class="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <g clip-path="url(#clip0_9606_143)">
                                            <path d="M2.5 18.3333H16.6667L19.1667 7.5H5L2.5 18.3333Z" stroke="#2579FF"
                                                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M15.8333 4.16602H8.33325L6.66659 1.66602H0.833252V14.9993" stroke="#2579FF"
                                                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_9606_143">
                                                <rect width="20" height="20" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                                <div class="content">
                                    <div class="name">${app_name}</div>
                                    <div class="description max-line-2">${app_description}</div>
                                </div>
                            </div>`;
            });

            jQuery(".service-catalogs").html(html);
            $(".service-catalogs .item").click(function (e) {
                e.preventDefault();
                modal.show();
                const appCode = jQuery(this).data("app");
                const title = jQuery(this).data("title");
                $("#sr-modal-title").html(title);
                $("input[name=app_code]").val(appCode);
                const newPList = processList.filter((item) => item.data.app_code == appCode);
                renderProcess(newPList);
            });
        }

        function renderProcess(list) {
            $("#pagination-item").pagination({
                dataSource: list,
                pageSize: 4,
                callback: function (data, pagination) {
                    let html = "";
                    $.each(data, function (index, item) {
                        const { process_image, process_name, process_url, process_description } = item.data;
                        html += `<a href="${process_url}" class="item">
                                        <div class="icon">
                                            ${process_image ? process_image : defaultImage}
                                        </div>
                                        <div class="content">
                                            <div class="name">${process_name}</div>
                                            <div class="description max-line-2">${process_description}</div>
                                        </div>
                                    </a>`;
                    });
                    $(".service-items").html(html);
                }
            });
        }
    });

    $(document).ready(function () {
        const param = workspace_id ? `?workspace_id=${workspace_id}` : "";
        jQuery.ajax({
            type: "GET",
            url: `/api/v2/solutions/categories${param}`,
            dataType: "json",
            headers: authHeader,
            success: function (response) {
                renderCategory(response.categories?.slice(1));
            }
        });
        function renderCategory(list) {
            let html = ``;
            let footer = ``;
            jQuery.map(list, function (item, index) {
                const { id, name, translations } = item;
                const transName = lang === "en" ? name : (translations.vi && translations.vi.name) || name;
                if (index < 4) footer += `<li><a href="/solutions/${id}">${transName}</a></li>`;
                html += `<a href="/support/solutions/${id}">${transName}</a>`;
            });
            jQuery(".solutions").html(html);
            jQuery("#services").html(footer);
        }
    });
});
