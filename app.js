// Dữ liệu mẫu và cấu hình
const CUSTOMERS = [
    { id: 1, name: "Công ty TNHH ABC", code_number: "C001", address: "123 Đường A, Quận 1, TP.HCM", phone: "0909123456" },
    { id: 2, name: "Công ty Cổ phần XYZ", code_number: "C002", address: "456 Đường B, Quận 2, TP.HCM", phone: "0909234567" },
    { id: 3, name: "Công ty TNHH Thương mại Dịch vụ 123", code_number: "C003", address: "789 Đường C, Quận 3, TP.HCM", phone: "0909345678" }
];

// Dữ liệu tuyến đường mẫu
const routes = [
    { "Tên Tuyến": "HCM - Hà Nội", "Mã tuyến": "R001", "Nơi nhận": "TP.HCM", "Nơi Giao": "Hà Nội" },
    { "Tên Tuyến": "HCM - Đà Nẵng", "Mã tuyến": "R002", "Nơi nhận": "TP.HCM", "Nơi Giao": "Đà Nẵng" },
    { "Tên Tuyến": "HCM - Cần Thơ", "Mã tuyến": "R003", "Nơi nhận": "TP.HCM", "Nơi Giao": "Cần Thơ" },
    { "Tên Tuyến": "Hà Nội - Hải Phòng", "Mã tuyến": "R004", "Nơi nhận": "Hà Nội", "Nơi Giao": "Hải Phòng" },
    { "Tên Tuyến": "Đà Nẵng - Quảng Ngãi", "Mã tuyến": "R005", "Nơi nhận": "Đà Nẵng", "Nơi Giao": "Quảng Ngãi" }
];
// Quy chuẩn mặt hàng
const PRODUCT_NAMES = [
    { name: "Thịt bò đông lạnh", type: "frozen" },
    { name: "Thịt heo đông lạnh", type: "frozen" },
    { name: "Thịt gà đông lạnh", type: "frozen" },
    { name: "Cá đông lạnh", type: "frozen" },
    { name: "Tôm đông lạnh", type: "frozen" },
    { name: "Kem đông lạnh", type: "frozen" },
    { name: "Thịt tươi", type: "cool" },
    { name: "Cá tươi", type: "cool" },
    { name: "Sữa tươi", type: "cool" },
    { name: "Phô mai", type: "cool" },
    { name: "Rau củ tươi", type: "cool" },
    { name: "Trái cây tươi", type: "cool" },
    { name: "Gạo", type: "dry" },
    { name: "Bột mì", type: "dry" },
    { name: "Đồ khô", type: "dry" },
    { name: "Hàng khô thông thường", type: "dry" }
];

// Quy cách đóng gói
const PACKAGING_OPTIONS = [
    "Túi nilon dày 0.1mm chống rò rỉ",
    "Thùng carton cách nhiệt",
    "Túi hút chân không",
    "Hộp nhựa kín",
    "Bao PP",
    "Pallet bọc màng co",
    "Thùng xốp + đá khô",
    "Gel đông lạnh"
];

// Nhiệt độ bảo quản
const TEMPERATURES = [
    "-18°C đến -23°C (Đông lạnh thực phẩm)",
    "Dưới -18°C (Kem)",
    "0°C đến 4°C (Thịt tươi, cá tươi)",
    "2°C đến 5°C (Sữa, phô mai)",
    "4°C đến 8°C (Rau củ, trái cây)",
    "Nhiệt độ phòng (Hàng khô)"
];


class OrderManager {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('orders')) || [];
        this.customerStores = JSON.parse(localStorage.getItem('customerStores')) || {};
        this.currentPage = 1;
        this.ordersPerPage = 10;
        this.isEditMode = false;
        this.currentEditId = null;
        this.filteredOrders = []; // Để lưu orders sau khi filter theo ngày
        this.cargoTypes = ['frozen', 'cool', 'dry']; // Các loại hàng hóa

        this.init();
    }

    init() {
        this.initializeData();
        this.setupEventListeners();
        this.updateCargoDetails(); // Khởi tạo chi tiết hàng hóa
        this.updateUI();
    }

    initializeData() {
        // Khởi tạo dữ liệu mẫu
        if (!localStorage.getItem('customers')) {
            localStorage.setItem('customers', JSON.stringify(CUSTOMERS));
        }
    }

    setupEventListeners() {
        // Form events
        document.getElementById('inputForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('cancelEdit').addEventListener('click', () => this.cancelEdit());

        // Export buttons
        document.getElementById('exportExcel').addEventListener('click', () => this.exportExcel());
     
        document.getElementById('exportParkingList').addEventListener('click', () => this.exportParkingList());
        document.getElementById('clearData').addEventListener('click', () => this.clearData());

        // Route selector
        document.getElementById('routeSelector').addEventListener('change', (e) => this.updateCartHeader(e.target.value));

        // Toggle sections
        this.setupToggleSections();

        // Quarantine toggle
        document.getElementById('isQuarantine').addEventListener('change', (e) => {
            this.toggleElement('quarantineSection', e.target.checked);
            this.calculateTotalFee();
        });

        document.getElementById('quarantineFee').addEventListener('input', () => this.calculateTotalFee());

        // Autocomplete
        this.setupAutocomplete();

        // Number formatting
        this.setupNumberFormatting();

        // Real-time calculations
        this.setupRealTimeCalculations();

        // Cargo changes to update details
        this.cargoTypes.forEach(type => {
            const weightId = `${type}Weight`;
            const packagesId = `${type}Packages`;
            const weightEl = document.getElementById(weightId);
            const packagesEl = document.getElementById(packagesId);
            if (weightEl) weightEl.addEventListener('input', () => this.updateCargoDetails());
            if (packagesEl) packagesEl.addEventListener('input', () => this.updateCargoDetails());
        });

        // QR Modal
        this.setupQRModal();
    }

    setupToggleSections() {
        document.getElementById('newCustomer').addEventListener('change', (e) => {
            this.toggleElement('newCustomerForm', e.target.checked);
        });

        document.getElementById('customPickup').addEventListener('change', (e) => {
            this.toggleElement('pickupAddress', e.target.checked);
        });

        document.getElementById('customDelivery').addEventListener('change', (e) => {
            this.toggleElement('deliveryAddress', e.target.checked);
        });
    }

    updateCargoDetails() {
        const container = document.getElementById('cargoDetailsContainer');
        container.innerHTML = '';

        this.cargoTypes.forEach(type => {
            const weight = this.parseNumber(document.getElementById(`${type}Weight`).value);
            const packages = this.parseNumber(document.getElementById(`${type}Packages`).value);
            if (weight > 0 || packages > 0) {
                const detailSection = document.createElement('div');
                detailSection.className = `cargo-detail-section ${type}`;
                detailSection.innerHTML = `
                    <h4>${type === 'frozen' ? 'Hàng Đông Lạnh' : type === 'cool' ? 'Hàng Mát' : 'Hàng Khô'}</h4>
                    <div class="form-row-3">
                        <div class="form-group">
                            <label>Tên mặt hàng:</label>
                            <div class="autocomplete">
                                <input type="text" class="productName-${type}" placeholder="Nhập tên mặt hàng">
                                <div class="productSuggestions-${type} autocomplete-suggestions hidden"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Quy cách đóng gói:</label>
                            <div class="autocomplete">
                                <input type="text" class="packaging-${type}" placeholder="Quy cách đóng gói">
                                <div class="packagingSuggestions-${type} autocomplete-suggestions hidden"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Nhiệt độ bảo quản:</label>
                            <div class="autocomplete">
                                <input type="text" class="storageTemp-${type}" placeholder="Nhiệt độ bảo quản">
                                <div class="tempSuggestions-${type} autocomplete-suggestions hidden"></div>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(detailSection);

                // Setup autocomplete for this section
                this.setupProductAutocomplete(`.productName-${type}`, `.productSuggestions-${type}`);
                this.setupPackagingAutocomplete(`.packaging-${type}`, `.packagingSuggestions-${type}`);
                this.setupTempAutocomplete(`.storageTemp-${type}`, `.tempSuggestions-${type}`);
            }
        });
    }

    setupAutocomplete() {
        const customerInput = document.getElementById('customerInput');
        const customerSuggestions = document.getElementById('customerSuggestions');

        customerInput.addEventListener('blur', () => {
            setTimeout(() => {
                customerSuggestions.classList.add('hidden');
            }, 200);
        });

        // Tương tự cho route 
        const routeInput = document.getElementById('routeInput');
        const routeSuggestions = document.getElementById('routeSuggestions');

        routeInput.addEventListener('blur', () => {
            setTimeout(() => {
                routeSuggestions.classList.add('hidden');
            }, 200);
        });

        // Tương tự cho store
        const storeInput = document.getElementById('storeInput');
        const storeSuggestions = document.getElementById('storeSuggestions');

        storeInput.addEventListener('blur', () => {
            setTimeout(() => {
                storeSuggestions.classList.add('hidden');
            }, 200);
        });

        // Customer autocomplete
        this.setupCustomerAutocomplete();

        // Store autocomplete
        this.setupStoreAutocomplete();

        // Route autocomplete
        this.setupRouteAutocomplete();
    }

    setupProductAutocomplete(selector, suggestionsSelector) {
        const input = document.querySelector(selector);
        const suggestions = document.querySelector(suggestionsSelector);

        if (!input || !suggestions) return;

        input.addEventListener('input', this.debounce(() => {
            const query = input.value.toLowerCase();
            suggestions.innerHTML = '';
            suggestions.classList.add('hidden');

            if (query.length < 2) return;

            const matches = PRODUCT_NAMES.filter(p => p.name.toLowerCase().includes(query));

            if (matches.length > 0) {
                suggestions.classList.remove('hidden');
                matches.forEach(product => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.innerHTML = `<strong>${this.highlightText(product.name, query)}</strong>`;
                    div.addEventListener('click', () => {
                        input.value = product.name;
                        suggestions.classList.add('hidden');
                    });
                    suggestions.appendChild(div);
                });
            }
        }, 300));

        input.addEventListener('blur', () => {
            setTimeout(() => suggestions.classList.add('hidden'), 200);
        });
    }

    setupPackagingAutocomplete(selector, suggestionsSelector) {
        const input = document.querySelector(selector);
        const suggestions = document.querySelector(suggestionsSelector);

        if (!input || !suggestions) return;

        input.addEventListener('input', this.debounce(() => {
            const query = input.value.toLowerCase();
            suggestions.innerHTML = '';
            suggestions.classList.add('hidden');

            if (query.length < 2) return;

            const matches = PACKAGING_OPTIONS.filter(p => p.toLowerCase().includes(query));

            if (matches.length > 0) {
                suggestions.classList.remove('hidden');
                matches.forEach(pack => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.textContent = pack;
                    div.addEventListener('click', () => {
                        input.value = pack;
                        suggestions.classList.add('hidden');
                    });
                    suggestions.appendChild(div);
                });
            }
        }, 300));

        input.addEventListener('blur', () => {
            setTimeout(() => suggestions.classList.add('hidden'), 200);
        });
    }

    setupTempAutocomplete(selector, suggestionsSelector) {
        const input = document.querySelector(selector);
        const suggestions = document.querySelector(suggestionsSelector);

        if (!input || !suggestions) return;

        input.addEventListener('input', this.debounce(() => {
            const query = input.value.toLowerCase();
            suggestions.innerHTML = '';
            suggestions.classList.add('hidden');

            if (query.length < 2) return;

            const matches = TEMPERATURES.filter(t => t.toLowerCase().includes(query));

            if (matches.length > 0) {
                suggestions.classList.remove('hidden');
                matches.forEach(temp => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.textContent = temp;
                    div.addEventListener('click', () => {
                        input.value = temp;
                        suggestions.classList.add('hidden');
                    });
                    suggestions.appendChild(div);
                });
            }
        }, 300));

        input.addEventListener('blur', () => {
            setTimeout(() => suggestions.classList.add('hidden'), 200);
        });
    }

    setupCustomerAutocomplete() {
        const customerInput = document.getElementById('customerInput');
        const suggestions = document.getElementById('customerSuggestions');

        customerInput.addEventListener('input', this.debounce(() => {
            const query = customerInput.value.toLowerCase();
            suggestions.innerHTML = '';
            suggestions.classList.add('hidden');

            if (query.length < 2) return;

            const customers = JSON.parse(localStorage.getItem('customers')) || CUSTOMERS;
            const matches = customers.filter(c =>
                c.name.toLowerCase().includes(query) ||
                (c.code_number && c.code_number.toLowerCase().includes(query))
            );

            if (matches.length > 0) {
                suggestions.classList.remove('hidden');
                matches.forEach(customer => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.innerHTML = `
                        <strong>${this.highlightText(customer.name, query)}</strong>
                        <br><small>${customer.code_number}</small>
                    `;
                    div.addEventListener('click', () => {
                        customerInput.value = customer.name;
                        document.getElementById('customer_id').value = customer.id || '';
                        suggestions.classList.add('hidden');
                        this.clearError('customerError');
                    });
                    suggestions.appendChild(div);
                });
            }
        }, 300));
    }

    setupStoreAutocomplete() {
        const storeInput = document.getElementById('storeInput');
        const suggestions = document.getElementById('storeSuggestions');

        storeInput.addEventListener('input', this.debounce(() => {
            const query = storeInput.value.toLowerCase();
            const customerName = document.getElementById('customerInput').value;
            suggestions.innerHTML = '';
            suggestions.classList.add('hidden');

            if (query.length < 2 || !customerName) return;

            const stores = this.customerStores[customerName] || [];
            const matches = stores.filter(store =>
                store.toLowerCase().includes(query)
            );

            if (matches.length > 0) {
                suggestions.classList.remove('hidden');
                matches.forEach(store => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.textContent = store;
                    div.addEventListener('click', () => {
                        storeInput.value = store;
                        document.getElementById('store_id').value = store;
                        suggestions.classList.add('hidden');
                    });
                    suggestions.appendChild(div);
                });
            }
        }, 300));
    }

    setupRouteAutocomplete() {
        const routeInput = document.getElementById('routeInput');
        const suggestions = document.getElementById('routeSuggestions');

        routeInput.addEventListener('input', this.debounce(() => {
            const query = routeInput.value.trim().toLowerCase();
            suggestions.innerHTML = '';
            suggestions.classList.add('hidden');

            if (query.length < 2) return;

            // Tìm kiếm trong routes
            const matches = routes.filter(route =>
                route["Tên Tuyến"].toLowerCase().includes(query) ||
                route["Mã tuyến"].toLowerCase().includes(query) ||
                route["Nơi nhận"].toLowerCase().includes(query) ||
                route["Nơi Giao"].toLowerCase().includes(query)
            ).slice(0, 10);

            if (matches.length > 0) {
                suggestions.classList.remove('hidden');
                matches.forEach(route => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.innerHTML = `
                        <strong>${this.highlightText(route["Tên Tuyến"], query)}</strong>
                        <br><small>Mã: ${route["Mã tuyến"]} | Nhận: ${route["Nơi nhận"]} | Giao: ${route["Nơi Giao"]}</small>
                    `;
                    div.addEventListener('click', () => {
                        routeInput.value = route["Tên Tuyến"];
                        document.getElementById('routeCode').value = route["Mã tuyến"];
                        document.getElementById('routeFrom').value = route["Nơi nhận"];
                        document.getElementById('routeTo').value = route["Nơi Giao"];
                        suggestions.classList.add('hidden');
                        this.updateRouteDisplay();
                        this.clearError('routeError');
                    });
                    suggestions.appendChild(div);
                });
            }
        }, 300));

        routeInput.addEventListener('blur', () => {
            setTimeout(() => {
                suggestions.classList.add('hidden');
                this.updateRouteDisplay();
            }, 200);
        });
    }

    updateRouteDisplay() {
        const routeInput = document.getElementById('routeInput');
        const routeText = document.getElementById('routeText');
        const routeDisplay = document.getElementById('routeDisplay');

        const inputValue = routeInput.value.trim();
        if (!inputValue) {
            routeDisplay.classList.add('hidden');
            return null;
        }

        // Tìm route trong danh sách
        const foundRoute = routes.find(route =>
            route["Tên Tuyến"] === inputValue ||
            route["Mã tuyến"] === inputValue
        );

        if (foundRoute) {
            // Nếu tìm thấy route trong danh sách
            routeText.textContent = `${foundRoute["Tên Tuyến"]} (${foundRoute["Mã tuyến"]})`;
            document.getElementById('routeCode').value = foundRoute["Mã tuyến"];
            document.getElementById('routeFrom').value = foundRoute["Nơi nhận"];
            document.getElementById('routeTo').value = foundRoute["Nơi Giao"];
            routeDisplay.classList.remove('hidden');
            return foundRoute;
        } else {
            // Nếu không tìm thấy, tạo route mới
            const routeInfo = this.parseCustomRoute(inputValue);
            if (routeInfo.isValid) {
                routeText.textContent = routeInfo.display;
                document.getElementById('routeCode').value = routeInfo.code || '';
                document.getElementById('routeFrom').value = routeInfo.from || '';
                document.getElementById('routeTo').value = routeInfo.to || '';
                routeDisplay.classList.remove('hidden');
                return routeInfo;
            } else {
                routeDisplay.classList.add('hidden');
                return null;
            }
        }
    }
    parseCustomRoute(input) {
        const trimmedInput = input.trim();

        // Kiểm tra định dạng "điểm bắt đầu -> điểm đến"
        if (trimmedInput.includes('->')) {
            const parts = trimmedInput.split('->');
            if (parts.length === 2) {
                const from = parts[0].trim();
                const to = parts[1].trim();

                return {
                    isValid: true,
                    display: `${from} -> ${to}`,
                    code: '', // Không có mã cho route tùy chỉnh
                    from: from,
                    to: to,
                    isCustom: true
                };
            }
        }

        // Nếu không có dấu "->", coi như toàn bộ là tên route
        return {
            isValid: true,
            display: trimmedInput,
            code: '',
            from: '',
            to: '',
            isCustom: true
        };
    }



    setupNumberFormatting() {
        // Định dạng số cho các trường số
        document.querySelectorAll('.number-input').forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            });
        });

        // Định dạng tiền tệ
        document.querySelectorAll('.money-input').forEach(input => {
            input.addEventListener('blur', (e) => {
                this.formatMoneyInput(e.target);
            });

            input.addEventListener('focus', (e) => {
                e.target.value = e.target.value.replace(/,/g, '');
            });
        });
    }

    setupRealTimeCalculations() {
        // Tính tổng hàng hóa và cước phí
        const calculationFields = [
            'frozenWeight', 'coolWeight', 'dryWeight',
            'defaultFreight', 'minimalFee',
            'pickupQuantity', 'pickupPrice', 'pickupUnit',
            'deliveryQuantity', 'deliveryPrice', 'deliveryUnit',
            'quarantineFee',
            'paymentAmount' // Thêm paymentAmount để sync
        ];

        calculationFields.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.addEventListener('change', () => this.calculateTotalFee());
                } else {
                    element.addEventListener('input', () => this.calculateTotalFee());
                }
            }
        });
    }

    calculateCargoTotals() {
        const frozenPackages = this.parseNumber(document.getElementById('frozenPackages').value);
        const coolPackages = this.parseNumber(document.getElementById('coolPackages').value);
        const dryPackages = this.parseNumber(document.getElementById('dryPackages').value);

        const frozenWeight = this.parseNumber(document.getElementById('frozenWeight').value);
        const coolWeight = this.parseNumber(document.getElementById('coolWeight').value);
        const dryWeight = this.parseNumber(document.getElementById('dryWeight').value);

        const totalPackages = frozenPackages + coolPackages + dryPackages;
        const totalWeight = frozenWeight + coolWeight + dryWeight;

        // Có thể cập nhật các trường tổng nếu cần
        console.log('Tổng kiện:', totalPackages, 'Tổng trọng lượng:', totalWeight);
    }

    calculateTotalWeight() {
        const frozenWeight = this.parseNumber(document.getElementById('frozenWeight').value);
        const coolWeight = this.parseNumber(document.getElementById('coolWeight').value);
        const dryWeight = this.parseNumber(document.getElementById('dryWeight').value);

        const totalWeight = frozenWeight + coolWeight + dryWeight;

        const totalWeightField = document.getElementById('totalWeightCalc');
        if (totalWeightField) {
            totalWeightField.value = totalWeight > 0 ? totalWeight : '';
        }

        return totalWeight;
    }

    calculateTotalFee() {
        const defaultFreight = this.parseMoney(document.getElementById('defaultFreight').value);
        const isMinimalFee = document.getElementById('minimalFee').checked;
        const totalWeight = this.calculateTotalWeight();

        const pickupQuantity = this.parseNumber(document.getElementById('pickupQuantity').value);
        const pickupPrice = this.parseMoney(document.getElementById('pickupPrice').value);
        const pickupUnit = document.getElementById('pickupUnit').value;

        const deliveryQuantity = this.parseNumber(document.getElementById('deliveryQuantity').value);
        const deliveryPrice = this.parseMoney(document.getElementById('deliveryPrice').value);
        const deliveryUnit = document.getElementById('deliveryUnit').value;

        const quarantineFee = document.getElementById('isQuarantine').checked ? this.parseMoney(document.getElementById('quarantineFee').value) : 0;

        // Tính phí vận chuyển
        let transportFee = 0;
        if (isMinimalFee) {
            transportFee = defaultFreight * 1; // 1 chuyến cho giá tối thiểu
        } else {
            transportFee = defaultFreight * totalWeight; // cước vận chuyển nhân với total kg
        }

        // Tính phí dịch vụ pickup
        let pickupTotal = 0;
        if (pickupQuantity > 0 && pickupPrice > 0) {
            if (pickupUnit === 'kg') {
                pickupTotal = pickupQuantity * pickupPrice;
            } else { // Chuyến
                pickupTotal = pickupQuantity * pickupPrice;
            }
        }

        // Tính phí dịch vụ delivery
        let deliveryTotal = 0;
        if (deliveryQuantity > 0 && deliveryPrice > 0) {
            if (deliveryUnit === 'kg') {
                deliveryTotal = deliveryQuantity * deliveryPrice;
            } else { // Chuyến
                deliveryTotal = deliveryQuantity * deliveryPrice;
            }
        }

        // Cập nhật thành tiền
        const pickupTotalField = document.getElementById('pickupTotal');
        if (pickupTotalField) {
            pickupTotalField.value = pickupTotal > 0 ? pickupTotal.toLocaleString() : '';
        }

        const deliveryTotalField = document.getElementById('deliveryTotal');
        if (deliveryTotalField) {
            deliveryTotalField.value = deliveryTotal > 0 ? deliveryTotal.toLocaleString() : '';
        }

        const quarantineDisplay = document.getElementById('quarantineFeeDisplay');
        if (quarantineDisplay) {
            quarantineDisplay.value = quarantineFee > 0 ? quarantineFee.toLocaleString() : '';
        }

        // Tổng cước = cước vận chuyển + phí lấy hàng + phí giao hàng + phí kiểm dịch
        const totalFee = transportFee + pickupTotal + deliveryTotal + quarantineFee;

        const totalFeeField = document.getElementById('totalFee');
        if (totalFeeField) {
            totalFeeField.value = totalFee > 0 ? totalFee.toLocaleString() : '';
        }

        // Tự động cập nhật số tiền thanh toán bằng tổng giá trị cước
        const paymentAmount = document.getElementById('paymentAmount');
        if (paymentAmount) {
            paymentAmount.value = totalFee > 0 ? totalFee.toLocaleString() : '';
        }

        return totalFee;
    }

    // Hàm sync payment amount với total fee
    syncPaymentAmount() {
        const totalFeeField = document.getElementById('totalFee');
        const paymentAmountField = document.getElementById('paymentAmount');

        if (totalFeeField && paymentAmountField) {
            const totalFeeValue = totalFeeField.value.replace(/,/g, '');
            if (totalFeeValue && totalFeeValue !== '0') {
                paymentAmountField.value = totalFeeValue;
            }
        }
    }

    setupQRModal() {
        document.getElementById('qrCloseBtn').addEventListener('click', () => {
            this.hideQRModal();
        });

        document.getElementById('qrPrintBtn').addEventListener('click', () => {
            window.print();
        });

        // Đóng modal khi click ra ngoài
        document.getElementById('qrModalBackdrop').addEventListener('click', (e) => {
            if (e.target.id === 'qrModalBackdrop') {
                this.hideQRModal();
            }
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = this.collectFormData();

        try {
            if (this.isEditMode) {
                this.updateOrder(formData);
            } else {
                this.createOrder(formData);
            }

            this.showNotification(
                this.isEditMode ? 'Đơn hàng đã được cập nhật thành công!' : 'Phiếu hàng đã được tạo thành công!',
                'success'
            );

            this.resetForm();
            this.updateUI();

        } catch (error) {
            console.error('Error saving order:', error);
            this.showNotification('Có lỗi xảy ra khi lưu đơn hàng!', 'error');
        }
    }

    collectFormData() {
        const isNewCustomer = document.getElementById('newCustomer').checked;
        let customer;

        if (isNewCustomer) {
            customer = document.getElementById('newName').value;
            const newCustomer = {
                name: customer,
                address: document.getElementById('newAddress').value,
                phone: document.getElementById('newPhone').value
            };
            this.addNewCustomer(newCustomer);
        } else {
            customer = document.getElementById('customerInput').value;
        }

        const routeName = document.getElementById('routeInput').value;
        const routeCode = document.getElementById('routeCode').value;
        const routeFrom = document.getElementById('routeFrom').value;
        const routeTo = document.getElementById('routeTo').value;
        const store = document.getElementById('storeInput').value;

        // Logic thông tin người nhận
        let recipientInfo = {};
        const hasStore = !!store;
        const hasCustomDelivery = document.getElementById('customDelivery').checked;
        if (!hasStore && !hasCustomDelivery) {
            recipientInfo = {
                name: document.getElementById('recipientName').value,
                phone: document.getElementById('recipientPhone').value,
                address: '',
                contact: ''
            };
        } else if (hasStore) {
            // Sử dụng thông tin store làm người nhận
            recipientInfo = { name: store, address: '', contact: '', phone: '' };
        } else if (hasCustomDelivery) {
            // Sử dụng thông tin giao tận nơi
            recipientInfo = {
                name: document.getElementById('deliveryContact').value || '',
                address: document.getElementById('deliveryAddr').value,
                contact: document.getElementById('deliveryContact').value || '',
                phone: document.getElementById('deliveryPhone').value || ''
            };
        }

        // Thu thập dữ liệu hàng hóa
        const cargoData = {
            frozen: {
                packages: this.parseNumber(document.getElementById('frozenPackages').value),
                weight: this.parseNumber(document.getElementById('frozenWeight').value),
                unit: document.getElementById('frozenUnit').value,
                details: {
                    productName: document.querySelector('.productName-frozen')?.value || '',
                    packaging: document.querySelector('.packaging-frozen')?.value || '',
                    storageTemp: document.querySelector('.storageTemp-frozen')?.value || ''
                }
            },
            cool: {
                packages: this.parseNumber(document.getElementById('coolPackages').value),
                weight: this.parseNumber(document.getElementById('coolWeight').value),
                unit: document.getElementById('coolUnit').value,
                details: {
                    productName: document.querySelector('.productName-cool')?.value || '',
                    packaging: document.querySelector('.packaging-cool')?.value || '',
                    storageTemp: document.querySelector('.storageTemp-cool')?.value || ''
                }
            },
            dry: {
                packages: this.parseNumber(document.getElementById('dryPackages').value),
                weight: this.parseNumber(document.getElementById('dryWeight').value),
                unit: document.getElementById('dryUnit').value,
                details: {
                    productName: document.querySelector('.productName-dry')?.value || '',
                    packaging: document.querySelector('.packaging-dry')?.value || '',
                    storageTemp: document.querySelector('.storageTemp-dry')?.value || ''
                }
            }
        };

        // Tính tổng
        const totalPackages = cargoData.frozen.packages + cargoData.cool.packages + cargoData.dry.packages;
        const totalWeight = cargoData.frozen.weight + cargoData.cool.weight + cargoData.dry.weight;

        // Quarantine info
        const isQuarantine = document.getElementById('isQuarantine').checked;
        const quarantineInfo = isQuarantine ? {
            certificate: document.getElementById('quarantineCertificate').value,
            fee: this.parseMoney(document.getElementById('quarantineFee').value),
            date: document.getElementById('quarantineDate').value
        } : null;

        return {
            id: this.isEditMode ? this.currentEditId : Date.now(),
            customer,
            store,
            route: routeName,
            routeCode,
            routeFrom,
            routeTo,
            ticketNumber: document.getElementById('ticketNumberInput').value,
            defaultFreight: this.parseMoney(document.getElementById('defaultFreight').value),
            isMinimalFee: document.getElementById('minimalFee').checked,
            cargoData,
            cargoNote: '', // No cargoNote in HTML, can add if needed
            totalPackages,
            totalWeight: this.calculateTotalWeight(),
            totalFee: this.calculateTotalFee(),
            paymentAmount: this.calculateTotalFee(), // Luôn bằng totalFee
            paymentMethod: 'bank_transfer', // Default, can add field
            pickupQuantity: this.parseNumber(document.getElementById('pickupQuantity').value),
            pickupPrice: this.parseMoney(document.getElementById('pickupPrice').value),
            pickupTotal: this.parseMoney(document.getElementById('pickupTotal').value),
            deliveryQuantity: this.parseNumber(document.getElementById('deliveryQuantity').value),
            deliveryPrice: this.parseMoney(document.getElementById('deliveryPrice').value),
            deliveryTotal: this.parseMoney(document.getElementById('deliveryTotal').value),
            pickupAddr: document.getElementById('customPickup').checked ? document.getElementById('pickupAddr').value : '',
            pickupContact: document.getElementById('customPickup').checked ? document.getElementById('pickupContact').value : '',
            pickupPhone: document.getElementById('customPickup').checked ? document.getElementById('pickupPhone').value : '',
            deliveryAddr: document.getElementById('customDelivery').checked ? document.getElementById('deliveryAddr').value : '',
            deliveryContact: document.getElementById('customDelivery').checked ? document.getElementById('deliveryContact').value : '',
            deliveryPhone: document.getElementById('customDelivery').checked ? document.getElementById('deliveryPhone').value : '',
            recipientInfo, // Thêm thông tin người nhận
            quarantineInfo,
            qrCode: null, // Trường QR code, sẽ được set khi generate
            date: new Date().toISOString()
        };
    }

    validateForm() {
        this.clearAllErrors();
        let isValid = true;

        // Validate khách hàng
        const isNewCustomer = document.getElementById('newCustomer').checked;
        if (isNewCustomer) {
            if (!document.getElementById('newName').value.trim()) {
                this.showError('newName', 'Vui lòng nhập tên khách hàng mới');
                isValid = false;
            }
        } else {
            if (!document.getElementById('customerInput').value.trim()) {
                this.showError('customerInput', 'Vui lòng chọn khách hàng');
                isValid = false;
            }
        }

        // Validate tuyến đường
        if (!document.getElementById('routeInput').value.trim()) {
            this.showError('routeInput', 'Vui lòng nhập tuyến đường');
            isValid = false;
        }

        // Validate số phiếu
        if (!document.getElementById('ticketNumberInput').value.trim()) {
            this.showError('ticketNumberInput', 'Vui lòng nhập số phiếu');
            isValid = false;
        }

        // Validate thông tin người nhận nếu cần
        const hasStore = !!document.getElementById('storeInput').value;
        const hasCustomDelivery = document.getElementById('customDelivery').checked;
        if (!hasStore && !hasCustomDelivery) {
            if (!document.getElementById('recipientName').value.trim()) {
                this.showError('recipientName', 'Vui lòng nhập tên người nhận');
                isValid = false;
            }
        }

        // Validate hàng hóa
        const hasCargoData = this.hasCargoData();
        if (!hasCargoData) {
            this.showNotification('Vui lòng nhập ít nhất một thông tin về hàng hóa', 'error');
            isValid = false;
        }

        return isValid;
    }

    hasCargoData() {
        const frozenPackages = this.parseNumber(document.getElementById('frozenPackages').value);
        const frozenWeight = this.parseNumber(document.getElementById('frozenWeight').value);
        const coolPackages = this.parseNumber(document.getElementById('coolPackages').value);
        const coolWeight = this.parseNumber(document.getElementById('coolWeight').value);
        const dryPackages = this.parseNumber(document.getElementById('dryPackages').value);
        const dryWeight = this.parseNumber(document.getElementById('dryWeight').value);

        return (frozenPackages + coolPackages + dryPackages) > 0 ||
            (frozenWeight + coolWeight + dryWeight) > 0;
    }

    createOrder(orderData) {
        this.orders.unshift(orderData);
        this.saveOrders();

        // Lưu thông tin cửa hàng nếu có
        if (orderData.customer && orderData.store) {
            this.addCustomerStore(orderData.customer, orderData.store);
        }
    }

    updateOrder(orderData) {
        const index = this.orders.findIndex(order => order.id === this.currentEditId);
        if (index !== -1) {
            this.orders[index] = orderData;
            this.saveOrders();
        }
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.isEditMode = true;
        this.currentEditId = orderId;

        // Điền dữ liệu vào form
        this.fillFormWithOrderData(order);

        // Hiển thị nút hủy
        document.getElementById('cancelEdit').classList.remove('hidden');
        document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> Cập nhật Phiếu';

        // Scroll đến form
        this.scrollToInputSection();
    }

    fillFormWithOrderData(order) {
        document.getElementById('customerInput').value = order.customer || '';
        document.getElementById('storeInput').value = order.store || '';
        document.getElementById('routeInput').value = order.route || '';
        document.getElementById('routeCode').value = order.routeCode || '';
        document.getElementById('routeFrom').value = order.routeFrom || '';
        document.getElementById('routeTo').value = order.routeTo || '';
        document.getElementById('ticketNumberInput').value = order.ticketNumber || '';

        // Cập nhật hiển thị tuyến đường
        this.updateRouteDisplay();

        // Điền thông tin người nhận
        if (order.recipientInfo) {
            document.getElementById('recipientName').value = order.recipientInfo.name || '';
            document.getElementById('recipientPhone').value = order.recipientInfo.phone || '';
        }

        // Điền thông tin hàng hóa
        if (order.cargoData && order.cargoData.frozen) {
            document.getElementById('frozenPackages').value = order.cargoData.frozen.packages || '';
            document.getElementById('frozenWeight').value = order.cargoData.frozen.weight || '';
            document.getElementById('frozenUnit').value = order.cargoData.frozen.unit || 'kg';
        }

        if (order.cargoData && order.cargoData.cool) {
            document.getElementById('coolPackages').value = order.cargoData.cool.packages || '';
            document.getElementById('coolWeight').value = order.cargoData.cool.weight || '';
            document.getElementById('coolUnit').value = order.cargoData.cool.unit || 'kg';
        }

        if (order.cargoData && order.cargoData.dry) {
            document.getElementById('dryPackages').value = order.cargoData.dry.packages || '';
            document.getElementById('dryWeight').value = order.cargoData.dry.weight || '';
            document.getElementById('dryUnit').value = order.cargoData.dry.unit || 'kg';
        }

        // Ghi chú hàng hóa
        // document.getElementById('cargoNote').value = order.cargoNote || ''; // No field

        // Thông tin thanh toán
        document.getElementById('paymentAmount').value = order.totalFee ? order.totalFee.toLocaleString() : '';
        // document.getElementById('paymentMethod').value = order.paymentMethod || 'bank_transfer'; // No field
        document.getElementById('defaultFreight').value = order.defaultFreight ? order.defaultFreight.toLocaleString() : '';
        document.getElementById('minimalFee').checked = order.isMinimalFee || false;

        // Thông tin pickup và delivery
        document.getElementById('pickupQuantity').value = order.pickupQuantity || '';
        document.getElementById('pickupPrice').value = order.pickupPrice ? order.pickupPrice.toLocaleString() : '';
        document.getElementById('pickupTotal').value = order.pickupTotal ? order.pickupTotal.toLocaleString() : '';
        document.getElementById('deliveryQuantity').value = order.deliveryQuantity || '';
        document.getElementById('deliveryPrice').value = order.deliveryPrice ? order.deliveryPrice.toLocaleString() : '';
        document.getElementById('deliveryTotal').value = order.deliveryTotal ? order.deliveryTotal.toLocaleString() : '';

        // Dịch vụ tận nơi
        if (order.pickupAddr) {
            document.getElementById('customPickup').checked = true;
            this.toggleElement('pickupAddress', true);
            document.getElementById('pickupAddr').value = order.pickupAddr || '';
            document.getElementById('pickupContact').value = order.pickupContact || '';
            document.getElementById('pickupPhone').value = order.pickupPhone || '';
        }

        if (order.deliveryAddr) {
            document.getElementById('customDelivery').checked = true;
            this.toggleElement('deliveryAddress', true);
            document.getElementById('deliveryAddr').value = order.deliveryAddr || '';
            document.getElementById('deliveryContact').value = order.deliveryContact || '';
            document.getElementById('deliveryPhone').value = order.deliveryPhone || '';
        }

        // Quarantine
        if (order.quarantineInfo) {
            document.getElementById('isQuarantine').checked = true;
            this.toggleElement('quarantineSection', true);
            document.getElementById('quarantineCertificate').value = order.quarantineInfo.certificate || '';
            document.getElementById('quarantineFee').value = order.quarantineInfo.fee ? order.quarantineInfo.fee.toLocaleString() : '';
            document.getElementById('quarantineDate').value = order.quarantineInfo.date || '';
        }

        // Update cargo details after filling weights
        this.updateCargoDetails();

        // Fill details from data
        this.cargoTypes.forEach(type => {
            if (order.cargoData && order.cargoData[type] && order.cargoData[type].details) {
                const details = order.cargoData[type].details;
                document.querySelector(`.productName-${type}`)?.setAttribute('value', details.productName || '');
                document.querySelector(`.packaging-${type}`)?.setAttribute('value', details.packaging || '');
                document.querySelector(`.storageTemp-${type}`)?.setAttribute('value', details.storageTemp || '');
            }
        });

        // Tính lại tổng phí
        this.calculateTotalFee();
    }

    cancelEdit() {
        this.isEditMode = false;
        this.currentEditId = null;
        document.getElementById('cancelEdit').classList.add('hidden');
        document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> Tạo Phiếu';
        this.resetForm();
    }

    deleteOrder(orderId) {
        if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;

        this.orders = this.orders.filter(order => order.id !== orderId);
        this.saveOrders();
        this.updateUI();
        this.showNotification('Đơn hàng đã được xóa!', 'success');
    }

    resetForm() {
        document.getElementById('inputForm').reset();
        this.clearAllErrors();

        // Ẩn các section ẩn
        this.toggleElement('newCustomerForm', false);
        this.toggleElement('pickupAddress', false);
        this.toggleElement('deliveryAddress', false);
        this.toggleElement('routeDisplay', false);
        this.toggleElement('quarantineSection', false);

        // Bỏ chọn checkbox
        document.getElementById('newCustomer').checked = false;
        document.getElementById('customPickup').checked = false;
        document.getElementById('customDelivery').checked = false;
        document.getElementById('isQuarantine').checked = false;

        // Xóa suggestions
        document.querySelectorAll('.autocomplete-suggestions').forEach(el => {
            el.classList.add('hidden');
        });

        this.updateCargoDetails();
    }

    // Filter theo ngày
    filterByDate() {
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        if (!fromDate || !toDate) {
            this.showNotification('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc', 'error');
            return;
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setDate(to.getDate() + 1); // Bao gồm ngày kết thúc

        this.filteredOrders = this.orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= from && orderDate < to;
        });

        this.currentPage = 1;
        this.updateOrdersTable();
        this.setupPagination();
        this.updateCartHeader();
    }

    clearDateFilter() {
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        this.filteredOrders = [];
        this.updateUI();
    }

    getDisplayOrders() {
        return this.filteredOrders.length > 0 ? this.filteredOrders : this.orders;
    }

    updateUI() {
        this.updateOrdersTable();
        this.setupPagination();
        this.updateRouteSelector();
        this.updateCartHeader();
    }

    updateOrdersTable() {
        const tbody = document.querySelector('#ordersTable tbody');
        const emptyState = document.getElementById('emptyState');

        const displayOrders = this.getDisplayOrders();

        if (displayOrders.length === 0) {
            emptyState.style.display = 'block';
            tbody.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';

        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const endIndex = Math.min(startIndex + this.ordersPerPage, displayOrders.length);

        tbody.innerHTML = displayOrders.slice(startIndex, endIndex).map((order, index) => `
            <tr>
                <td class="text-center">${new Date(order.date).toLocaleDateString('vi-VN')}</td>
                <td class="text-center"><strong>${order.customer}</strong></td>
                <td class="text-center"><strong>${order.route}</strong></td>
                <td class="text-center"><strong>${order.ticketNumber || ''}</strong></td>
                <td class="text-center"><strong>${order.totalWeight ? Number(order.totalWeight).toLocaleString() : '0'}</strong></td>
                <td class="text-center">
                    <input type="text" class="money-input" data-order-id="${order.id}" 
                           value="${order.totalFee ? Number(order.totalFee).toLocaleString() : ''}" 
                           placeholder="0" onblur="orderManager.updateOrderTotalFee(this)">
                </td>
                <td class="text-center">
                    <span class="qr-status ${order.qrCode ? 'has-qr' : ''}">${order.qrCode ? 'Có QR' : 'Chưa có'}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group">
                        <button onclick="window.open('transport_note.html?id=${order.id}', '_blank')" class="btn btn-info" title="Xem phiếu vận chuyển">
                            <i class="fas fa-file-alt"></i>
                        </button>
                        <button class="btn btn-warning" onclick="orderManager.showQRCode(${order.id})" title="Xem QR thanh toán">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button class="btn btn-edit" onclick="orderManager.editOrder(${order.id})" title="Chỉnh sửa đơn hàng">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-reset" onclick="orderManager.deleteOrder(${order.id})" title="Xóa đơn hàng">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.attachMoneyInputHandlers();
    }

    updateOrderTotalFee(input) {
        const orderId = parseInt(input.dataset.orderId);
        const totalFee = this.parseMoney(input.value);

        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.totalFee = totalFee;
            this.saveOrders();
        }
    }

    setupPagination() {
        const pagination = document.getElementById('pagination');
        const displayOrders = this.getDisplayOrders();
        const pageCount = Math.ceil(displayOrders.length / this.ordersPerPage);

        if (pageCount <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';

        // Nút Previous
        if (this.currentPage > 1) {
            html += `<button onclick="orderManager.goToPage(${this.currentPage - 1})">&laquo;</button>`;
        }

        // Các nút trang
        for (let i = 1; i <= pageCount; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" 
                             onclick="orderManager.goToPage(${i})">${i}</button>`;
        }

        // Nút Next
        if (this.currentPage < pageCount) {
            html += `<button onclick="orderManager.goToPage(${this.currentPage + 1})">&raquo;</button>`;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.updateOrdersTable();
        this.setupPagination();
    }

    updateRouteSelector() {
        const selector = document.getElementById('routeSelector');
        const uniqueRoutes = [...new Set(this.orders.map(order => order.route))].filter(route => route);

        selector.innerHTML = '<option value="">-- Chọn tuyến đường --</option><option value="all">Tất cả</option>';

        uniqueRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route;
            option.textContent = route;
            selector.appendChild(option);
        });
    }

    updateCartHeader(selectedRoute = null) {
        const route = selectedRoute || document.getElementById('routeSelector').value;
        let filteredOrders = this.getDisplayOrders();

        if (route && route !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.route === route);
        }

        const totalWeight = filteredOrders.reduce((sum, order) => sum + (order.totalWeight || 0), 0);
        const totalPackages = filteredOrders.reduce((sum, order) => sum + (order.totalPackages || 0), 0);

        document.getElementById('totalOrders').textContent = filteredOrders.length;
        document.getElementById('totalWeight').textContent = totalWeight.toLocaleString();
        document.getElementById('totalVolume').textContent = totalPackages.toLocaleString();
        document.getElementById('totalTickets').textContent = filteredOrders.length;
    }

    showQRCode(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Không tìm thấy đơn hàng!', 'error');
            return;
        }

        const amount = order.totalFee || 0;
        const ticket = order.ticketNumber || order.id;

        if (amount <= 0) {
            this.showNotification('Không thể tạo mã QR thanh toán! Đơn hàng chưa có tổng cước phí hoặc số tiền bằng 0.', 'error');
            return;
        }

        // Generate QR và lưu vào order
        const qrCodeValue = `QR_${ticket}_${Date.now()}`; // Mã QR đơn giản, có thể thay bằng QR thực
        order.qrCode = qrCodeValue;
        this.saveOrders();

        const qrHtml = generateQRCode(amount, ticket, order.customer, 300, 300);

        document.getElementById('qrModalTitle').textContent = `PHIẾU THU - Số: ${ticket}`;
        document.getElementById('qrModalContent').innerHTML = `
            <div class="text-center">
                ${qrHtml}
                <div class="qr-amount">Số tiền: ${amount.toLocaleString()} VND</div>
                <div class="qr-info">
                    <p><strong>Khách hàng:</strong> ${order.customer}</p>
                    <p><strong>Ngày tạo:</strong> ${new Date(order.date).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Số phiếu:</strong> ${ticket}</p>
                    <p><strong>Mã QR:</strong> ${qrCodeValue}</p>
                </div>
            </div>
        `;

        this.showQRModal();
        this.updateUI(); // Cập nhật bảng để hiển thị QR status
    }

    showQRModal() {
        document.getElementById('qrModalBackdrop').classList.remove('hidden');
    }

    hideQRModal() {
        document.getElementById('qrModalBackdrop').classList.add('hidden');
    }

    // Export Parking List theo mẫu, multiple rows for cargo types
    async exportParkingList() {
        const displayOrders = this.getDisplayOrders();
        if (displayOrders.length === 0) {
            this.showNotification('Không có dữ liệu để export!', 'error');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Sheet1');

            // Header row1
            ws.addRow(['No', 'Mã Phiếu giao nhận (70)', 'Tên khách hàng (NGƯỜI GỬI HÀNG)', 'Tên hàng (6)', 'Quy cách đóng gói', 'Nhiệt độ bảo quản (10)', 'Số Lượng', 'Trọng Lượng gộp (8)', '(23)', 'Số Khối (9)', '(22)', 'Yêu cầu Konoike Vina khi NHẬN hàng vận chuyển', '', '', '', 'Nhận hàng tại Kho/bãi KNK', 'Nhận tại Kho Khách hàng', '', '', '', '', 'Yêu cầu Konoike Vina khi GIAO hàng vận chuyển', '', '', '', '', '', '', '', 'Số xe Nam Bắc (kèm điện thoại lái xe)', 'Ghi Chú', 'KẾ HOẠCH GIAO HÀNG', '']);
            ws.addRow(['', '', '', 'Số kiện (7)', '(21)', '', '', '', '', '', '', '', 'Tỉnh', 'Phường', 'Liên lạc', 'Ghi chú', '', 'Người nhận', 'Mã Người nhận (36)', 'Tỉnh', 'Phường', 'Liên lạc', 'Ghi chú', '', '', 'Số xe', 'Lái xe', 'Ngày giờ dự kiến giao']);
            ws.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

            let rowNum = 4;
            let globalNo = 1;
            displayOrders.forEach((order) => {
                const customers = JSON.parse(localStorage.getItem('customers')) || CUSTOMERS;
                const customerData = customers.find(c => c.name === order.customer);
                const customerCode = customerData ? customerData.code_number : '';

                const nhanHangTai = order.pickupAddr || 'Kho KNK';
                const keHoachGiaoHang = order.deliveryAddr || (order.store || 'Kho KNK') + ', ' + order.route;

                // For each cargo type with data
                this.cargoTypes.forEach(type => {
                    const cargo = order.cargoData[type];
                    if (cargo && (cargo.packages > 0 || cargo.weight > 0)) {
                        const details = cargo.details || {};
                        const tenHang = details.productName || (type === 'frozen' ? '(40RF) CONT 40\' LẠNH' : 'Hàng Thường');
                        const quyCach = details.packaging || 'Cần thông tin';
                        const nhietDo = details.storageTemp || 'Cần thông tin';
                        const soLuong = cargo.packages || 0;
                        const trongLuong = cargo.weight || 0;
                        const soKhoi = null;

                        // Dòng chính
                        ws.addRow([
                            globalNo++, '', order.customer, tenHang, quyCach, nhietDo, soLuong, trongLuong, '(23)', soKhoi, '(22)',
                            null, null, null, null, null, nhanHangTai, '', order.customer, customerCode,
                            null, null, null, null, '', '', '', 'Ngày giờ dự kiến giao', keHoachGiaoHang, '', ''
                        ]);

                        rowNum++;
                    }
                });
            });

            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mẫu parkinglist_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Đã export Parking List thành công!');
        } catch (error) {
            console.error('Lỗi khi export Parking List:', error);
            this.showNotification('Có lỗi xảy ra khi export Parking List!', 'error');
        }
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark class="bg-warning">$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    parseNumber(value) {
        return parseFloat(value?.toString().replace(/,/g, '')) || 0;
    }

    parseMoney(value) {
        return parseInt(value?.toString().replace(/[^0-9]/g, '')) || 0;
    }

    formatMoneyInput(input) {
        const value = input.value.replace(/[^0-9]/g, '');
        if (value) {
            input.value = parseInt(value).toLocaleString();
        }
    }

    attachMoneyInputHandlers() {
        document.querySelectorAll('.money-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(/,/g, '');
                const num = raw ? parseFloat(raw) : 0;
                e.target.value = num ? num.toLocaleString() : '';
            });
        });
    }

    toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden', !show);
        }
    }

    showError(inputId, message) {
        const input = document.getElementById(inputId);
        const errorElement = document.getElementById(inputId + 'Error');

        if (input) input.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearError(inputId) {
        const input = document.getElementById(inputId);
        const errorElement = document.getElementById(inputId + 'Error');

        if (input) input.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message.show').forEach(el => el.classList.remove('show'));
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');

        if (!notification || !messageElement) return;

        messageElement.textContent = message;
        notification.className = `notification ${type === 'error' ? 'error' : 'success'}`;
        notification.classList.remove('hidden');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hidden');
        }, 3000);
    }

    scrollToInputSection() {
        const element = document.getElementById('input-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    addNewCustomer(customer) {
        const customers = JSON.parse(localStorage.getItem('customers')) || CUSTOMERS;
        customers.push(customer);
        localStorage.setItem('customers', JSON.stringify(customers));
    }

    addCustomerStore(customer, store) {
        if (!this.customerStores[customer]) {
            this.customerStores[customer] = [];
        }
        if (!this.customerStores[customer].includes(store)) {
            this.customerStores[customer].push(store);
            localStorage.setItem('customerStores', JSON.stringify(this.customerStores));
        }
    }

    saveOrders() {
        localStorage.setItem('orders', JSON.stringify(this.orders));
    }

    clearData() {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
            localStorage.removeItem('orders');
            this.orders = [];
            this.updateUI();
            this.showNotification('Đã xóa tất cả dữ liệu!', 'success');
        }
    }

    

    async exportExcel() {
        const displayOrders = this.getDisplayOrders();
        if (displayOrders.length === 0) {
            this.showNotification('Không có dữ liệu để export!', 'error');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Tổng hợp');

            // Header row
            ws.addRow(["Số phiếu",
                "Người thanh toán", "Người gửi hàng", "Mã tuyến", "Số kiện", "Khối lượng",
                "Tính theo giá", "Ngày lập", "Mã hàng", "Đvt", "Số kiện", "Số kg",
                "Đvt giá", "SL tính giá", "Giá", "Mã thuế", "Người nhận", "Mã chi phí",
                "Dvt", "Số lượng", "Đơn giá", "Mã thuế", "Mã quyển", "Nơi giao", "Nơi nhận"
            ]);

            // Data rows
            displayOrders.forEach(order => {
                const soPhieu = order.ticketNumber ;
                const orderDate = new Date(order.date);
                const month = String(orderDate.getMonth() + 1).padStart(2, '0');

                // Lấy code_number của customer
                const customers = JSON.parse(localStorage.getItem('customers')) || CUSTOMERS;
                const customerData = customers.find(c => c.name === order.customer);
                const customerCode = customerData ? customerData.code_number : order.customer;

                const maQuyen = `PLQ125${month}`;

                // Sử dụng thông tin route mới
                const routeCode = order.routeCode || '';
                const noiGiao = order.routeTo || '';  // Nơi giao
                const noiNhan = order.routeFrom || ''; // Nơi nhận

                // Tính toán đơn vị tính giá và số lượng tính giá cho vận chuyển chính
                const isMinimalFee = order.isMinimalFee || false;
                const dvtTinhGia = isMinimalFee ? 'Chuyến' : 'Kg';
                const slTinhGia = isMinimalFee ? 1 : (order.totalWeight || 0);

                // Giá cước vận chuyển
                const giaCuoc = order.defaultFreight || 0;

                // Thông tin dịch vụ
                const hasPickup = order.pickupAddr && order.pickupPrice > 0;
                const hasDelivery = order.deliveryAddr && order.deliveryPrice > 0;
                const pickupUnit = 'Chuyến'; // Default
                const deliveryUnit = 'Chuyến'; // Default
                const pickupQuantity = order.pickupQuantity || 1;
                const deliveryQuantity = order.deliveryQuantity || 1;
                const pickupPrice = order.pickupPrice || 0;
                const deliveryPrice = order.deliveryPrice || 0;


                console.log('customerCode');


                // DÒNG CHÍNH CHO VẬN CHUYỂN HÀNG HÓA
                if (!hasDelivery && !hasPickup) {
                    ws.addRow(
                        [   
                            soPhieu,
                            customerCode, // Người thanh toán = code_number
                            customerCode, // Người gửi hàng = code_number
                            routeCode, // Mã tuyến
                            order.totalPackages || 0, // Số kiện
                            order.totalWeight || 0, // Khối lượng
                            0, // Tính theo giá
                            orderDate.toLocaleDateString('vi-VN'), // Ngày lập
                            '0033-1605010', // Mã hàng
                            'Kg', // Đvt
                            order.totalPackages || 0, // Số kiện (cột thứ 2)
                            order.totalWeight || 0, // Số kg
                            dvtTinhGia, // Đvt tính giá
                            slTinhGia, // SL tính giá
                            giaCuoc, // Giá = giá cước
                            '08', // Mã thuế
                            customerCode, // Người nhận = code_number
                            '', // Mã chi phí (để trống cho dòng chính)
                            '', // Dvt
                            '', // Số lượng
                            '', // Đơn giá
                            '', // Mã thuế
                            maQuyen, // Mã quyển
                            noiGiao, // Nơi giao
                            noiNhan  // Nơi nhận
                        ]
                    );
                }
                else if ((hasPickup) || (hasDelivery)) {
                    ws.addRow(
                        [
                            soPhieu,
                            customerCode, // Người thanh toán
                            customerCode, // Người gửi hàng
                            routeCode, // Mã tuyến
                            order.totalPackages || 0, // Số kiện
                            order.totalWeight || 0, // Khối lượng
                            0, // Tính theo giá
                            orderDate.toLocaleDateString('vi-VN'), // Ngày lập
                            '0033-1605010', // Mã hàng
                            'Kg', // Đvt
                            order.totalPackages || 0, // Số kiện (cột thứ 2)
                            order.totalWeight || 0, // Số kg
                            dvtTinhGia, // Đvt tính giá
                            slTinhGia, // SL tính giá
                            giaCuoc, // Giá = giá cước
                            '08', // Mã thuế
                            customerCode, // Người nhận = code_number
                            'DT053', // Mã chi phí (để trống cho dòng chính)
                            pickupUnit || deliveryUnit,  // Dvt
                            pickupQuantity || deliveryQuantity, // Số lượng
                            pickupPrice || deliveryPrice, // Đơn giá
                            '08', // Mã thuế
                            maQuyen, // Mã quyển
                            noiGiao, // Nơi giao
                            noiNhan  // Nơi nhận
                        ]);
                }
                else if (hasPickup && hasDelivery) {
                    ws.addRow(
                        [
                            soPhieu,
                            customerCode, // Người thanh toán
                            customerCode, // Người gửi hàng
                            routeCode, // Mã tuyến
                            order.totalPackages || 0, // Số kiện
                            order.totalWeight || 0, // Khối lượng
                            0, // Tính theo giá
                            orderDate.toLocaleDateString('vi-VN'), // Ngày lập
                            '0033-1605010', // Mã hàng
                            'Kg', // Đvt
                            order.totalPackages || 0, // Số kiện (cột thứ 2)
                            order.totalWeight || 0, // Số kg
                            dvtTinhGia, // Đvt tính giá
                            slTinhGia, // SL tính giá
                            giaCuoc, // Giá = giá cước
                            '08', // Mã thuế
                            customerCode, // Người nhận = code_number
                            'DT053', // Mã chi phí (để trống cho dòng chính)
                            pickupUnit, // Dvt
                            pickupQuantity, // Số lượng
                            pickupPrice, // Đơn giá
                            '08', // Mã thuế
                            maQuyen, // Mã quyển
                            noiGiao, // Nơi giao
                            noiNhan  // Nơi nhận
                        ]);
                    ws.addRow(
                        [
                            soPhieu,
                            customerCode, // Người thanh toán
                            customerCode, // Người gửi hàng
                            routeCode, // Mã tuyến
                            order.totalPackages || 0, // Số kiện
                            order.totalWeight || 0, // Khối lượng
                            0, // Tính theo giá
                            orderDate.toLocaleDateString('vi-VN'), // Ngày lập
                            '0033-1605010', // Mã hàng
                            'Kg', // Đvt
                            order.totalPackages || 0, // Số kiện (cột thứ 2)
                            '', // Số kg
                            '',  // Đvt tính giá
                            '',  // SL tính giá
                            '', // Giá = giá cước
                            '',  // Mã thuế
                            customerCode, // Người nhận = code_number
                            'DT053', // Mã chi phí (để trống cho dòng chính)
                            deliveryUnit, // Dvt
                            deliveryQuantity, // Số lượng
                            deliveryPrice, // Đơn giá
                            '08', // Mã thuế
                            maQuyen, // Mã quyển
                            noiGiao, // Nơi giao
                            noiNhan  // Nơi nhận
                        ]);
                }
            });

            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tong_hop_don_hang_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Đã export Excel tổng hợp thành công!');
        } catch (error) {
            console.error('Lỗi khi export Excel tổng hợp:', error);
            this.showNotification('Có lỗi xảy ra khi export Excel tổng hợp!', 'error');
        }
    }


}

// Khởi tạo ứng dụng khi DOM đã load
let orderManager;
document.addEventListener('DOMContentLoaded', function () {
    orderManager = new OrderManager();
});

// Hàm toàn cục để gọi từ HTML
window.scrollToInputSection = function () {
    if (orderManager) orderManager.scrollToInputSection();
};