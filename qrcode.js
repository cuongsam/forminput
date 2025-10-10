// Hàm tạo QR code thanh toán custom
function generateQRCode(amount, ticketNumber, customerName = '', width = 200, height = 200) {
    // VietQR params (mặc định demo): thay thế bằng thông tin thật của bạn
    const bankKNK = "970436"; 
    const accountNumber = "0181000026301";
    const accountName = encodeURIComponent("CÔNG TY TNHH VẬN TẢI VIỆT NHẬT");
    
    // Tạo nội dung chuyển khoản với tên khách hàng và số phiếu
    const transferContent = customerName ? 
        `TT PHIEU : ${ticketNumber}`: 
        `TT PHIEU : ${ticketNumber}`;

    const addInfo = encodeURIComponent(transferContent);
    const amt = Number(amount || 0);

    // Ảnh VietQR tĩnh (QR server) – hiển thị được trên mọi thiết bị
    const imgSrc = `https://img.vietqr.io/image/${bankKNK}-${accountNumber}-compact.png?amount=${amt}&addInfo=${addInfo}&accountName=${accountName}`;
    const deeplink = `https://api.vietqr.io/qr?bin=${bankKNK}&account=${accountNumber}&amount=${amt}&addInfo=${addInfo}&accountName=${accountName}`;

    const html = `
        <a href="${deeplink}" target="_blank" rel="noopener" style="display:inline-block">
            <img src="${imgSrc}" alt="VietQR" style="width:${width}px;height:${height}px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;background:#fff" />
        </a>
    `;
    return html;
}

// Hàm tạo mã vạch (barcode) cho số phiếu
function generateBarcode(ticketNumber, width = 300, height = 80) {
    // Sử dụng JsBarcode nếu có, nếu không thì tạo fallback
    if (typeof JsBarcode !== 'undefined') {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, ticketNumber, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 16,
            margin: 10
        });
        return `<img src="${canvas.toDataURL()}" alt="Barcode ${ticketNumber}" style="width:${width}px;height:${height}px;">`;
    } else {
        // Fallback: hiển thị số phiếu dạng text
        return `<div style="width:${width}px;height:${height}px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;background:#f9f9f9;">
                    <strong>${ticketNumber}</strong>
                </div>`;
    }
}

// Hàm mở modal hiển thị phiếu thu đầy đủ
function openReceiptModal(index) {
    const order = orders[index];
    if (!order) {
        showNotification('Không tìm thấy đơn hàng!', true);
        return;
    }

    const amount = order.paymentAmount || 0;
    const ticket = order.ticketNumber || order.id || 'N/A';
    const customer = order.customer || '';

    if (amount <= 0) {
        showNotification('Đơn hàng chưa có số tiền thanh toán!', true);
        return;
    }

    // Tạo QR code thanh toán
    const qrHtml = generateQRCode(amount, ticket, customer, 250, 250);
    
    // Tạo mã vạch cho số phiếu
    const barcodeHtml = generateBarcode(ticket, 300, 80);

    // Tạo nội dung phiếu thu
    const receiptHtml = `
        <div class="receipt-container" style="max-width:800px;margin:0 auto;padding:20px;background:white;border-radius:8px;">
            <!-- Header -->
            <div class="receipt-header" style="text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px;">
                <h2 style="margin:0;color:#2c5aa0;">PHIẾU THU</h2>
                <p style="margin:5px 0;font-size:14px;color:#666;">Số: ${ticket}</p>
                <p style="margin:0;font-size:12px;color:#888;">Ngày: ${new Date(order.date).toLocaleDateString('vi-VN')}</p>
            </div>

            <!-- Thông tin chính -->
            <div class="receipt-body" style="margin-bottom:20px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
                    <!-- Thông tin khách hàng -->
                    <div>
                        <h4 style="margin-bottom:10px;color:#2c5aa0;">BÊN NỘP TIỀN</h4>
                        <p><strong>Khách hàng:</strong> ${customer}</p>
                        ${order.store ? `<p><strong>Cửa hàng:</strong> ${order.store}</p>` : ''}
                        <p><strong>Tuyến đường:</strong> ${order.route}</p>
                    </div>
                    
                    <!-- Thông tin thanh toán -->
                    <div>
                        <h4 style="margin-bottom:10px;color:#2c5aa0;">THÔNG TIN THANH TOÁN</h4>
                        <p><strong>Số tiền:</strong> <span style="font-size:18px;font-weight:bold;color:#e74c3c;">${amount.toLocaleString()} VND</span></p>
                        <p><strong>Hình thức:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
                        <p><strong>Ngày tạo:</strong> ${new Date(order.date).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>

                <!-- QR Code và Barcode -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center;margin:30px 0;">
                    <!-- QR Code -->
                    <div style="text-align:center;">
                        <h4 style="margin-bottom:10px;color:#2c5aa0;">QR THANH TOÁN</h4>
                        <div style="display:inline-block;padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:white;">
                            ${qrHtml}
                        </div>
                        <p style="font-size:12px;color:#666;margin-top:10px;">Quét QR để chuyển khoản</p>
                    </div>

                    <!-- Barcode -->
                    <div style="text-align:center;">
                        <h4 style="margin-bottom:10px;color:#2c5aa0;">MÃ VẠCH PHIẾU</h4>
                        <div style="display:inline-block;padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:white;">
                            ${barcodeHtml}
                        </div>
                        <p style="font-size:12px;color:#666;margin-top:10px;">Số phiếu: ${ticket}</p>
                    </div>
                </div>

                <!-- Thông tin hàng hóa -->
                <div style="margin:20px 0;">
                    <h4 style="margin-bottom:10px;color:#2c5aa0;">THÔNG TIN HÀNG HÓA</h4>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:14px;">
                        <div><strong>Loại hàng:</strong> ${getCargoTypeText(order.cargoType)}</div>
                        <div><strong>Số kiện:</strong> ${order.totalPackages || 0}</div>
                        <div><strong>Trọng lượng:</strong> ${order.totalWeight || 0} kg</div>
                        <div><strong>Khối lượng:</strong> ${order.totalVolume || 0} m³</div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="receipt-footer" style="border-top:1px solid #ccc;padding-top:15px;margin-top:20px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                    <div style="text-align:center;">
                        <p><strong>Người nộp tiền</strong></p>
                        <p style="margin-top:50px;font-style:italic;">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div style="text-align:center;">
                        <p><strong>Người thu tiền</strong></p>
                        <p style="margin-top:50px;font-style:italic;">(Ký, ghi rõ họ tên)</p>
                    </div>
                </div>
                
                <!-- Thông tin ngân hàng -->
                <div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:5px;font-size:12px;">
                    <h5 style="margin:0 0 10px 0;color:#2c5aa0;">THÔNG TIN NGÂN HÀNG</h5>
                    <p style="margin:5px 0;"><strong>Ngân hàng:</strong> Vietcombank</p>
                    <p style="margin:5px 0;"><strong>Số tài khoản:</strong> 0181000026301</p>
                    <p style="margin:5px 0;"><strong>Chủ tài khoản:</strong> CÔNG TY TNHH VẬN TẢI VIỆT NHẬT</p>
                    <p style="margin:5px 0;"><strong>Nội dung:</strong> CÔNG TY TNHH VẬN TẢI VIỆT NHẬT thanh toán theo số phiếu ${ticket}</p>
                </div>
            </div>
        </div>
    `;

    // Tạo modal hiển thị phiếu thu
    const wrapper = document.createElement('div');
    wrapper.className = 'qr-modal-backdrop';
    wrapper.innerHTML = `
        <div class="qr-modal" style="max-width:900px;">
            <div class="qr-modal-header">
                <span>PHIẾU THU - Số: ${ticket}</span>
                <div>
                    <button class="btn btn-info" id="receiptPrintBtn" title="In phiếu thu">
                        <i class="fas fa-print"></i> In phiếu thu
                    </button>
                    <button class="btn btn-warning" id="receiptDownloadBtn" title="Tải PDF">
                        <i class="fas fa-download"></i> PDF
                    </button>
                    <button class="btn btn-reset" id="receiptCloseBtn" title="Đóng">&times;</button>
                </div>
            </div>
            <div class="qr-modal-body" style="max-height:80vh;overflow-y:auto;">
                ${receiptHtml}
            </div>
        </div>
    `;

    document.body.appendChild(wrapper);

    // Event listeners
    document.getElementById('receiptCloseBtn').addEventListener('click', () => wrapper.remove());
    
    document.getElementById('receiptPrintBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        printReceipt(receiptHtml, ticket, customer, amount);
    });
    
    document.getElementById('receiptDownloadBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadReceiptPDF(receiptHtml, `Phieu_thu_${ticket}`);
    });

    wrapper.addEventListener('click', (e) => {
        if (e.target === wrapper) wrapper.remove();
    });

    wrapper.focus();
    wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') wrapper.remove();
    });
}

// Hàm in phiếu thu
function printReceipt(receiptHtml, ticketNumber, customer, amount) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Phiếu thu ${ticketNumber}</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 20px; 
                    color: #333;
                    line-height: 1.4;
                }
                .receipt-container { 
                    max-width: 700px; 
                    margin: 0 auto; 
                    padding: 20px;
                    border: 2px solid #000;
                    border-radius: 8px;
                }
                .receipt-header { 
                    text-align: center; 
                    border-bottom: 3px double #333; 
                    padding-bottom: 15px; 
                    margin-bottom: 20px; 
                }
                .receipt-header h2 { 
                    margin: 0; 
                    color: #2c5aa0; 
                    font-size: 24px;
                    text-transform: uppercase;
                }
                .amount-highlight {
                    font-size: 20px;
                    font-weight: bold;
                    color: #e74c3c;
                }
                .qr-section, .barcode-section {
                    text-align: center;
                    margin: 20px 0;
                }
                .bank-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    .receipt-container { border: none; box-shadow: none; }
                }
            </style>
        </head>
        <body>
            ${receiptHtml}
            <div class="no-print" style="text-align:center;margin-top:20px;padding-top:20px;border-top:1px solid #ccc;">
                <button onclick="window.print()" style="padding:10px 20px;background:#2c5aa0;color:white;border:none;border-radius:5px;cursor:pointer;">
                    In phiếu thu
                </button>
                <button onclick="window.close()" style="padding:10px 20px;background:#6c757d;color:white;border:none;border-radius:5px;cursor:pointer;margin-left:10px;">
                    Đóng
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Hàm tải PDF (placeholder - cần tích hợp thư viện PDF)
function downloadReceiptPDF(htmlContent, filename) {
    showNotification('Tính năng tải PDF đang được phát triển. Vui lòng sử dụng chức năng in và lưu dưới dạng PDF.', true);
    // Có thể tích hợp với thư viện jsPDF hoặc html2pdf.js sau
}

// Hàm chuyển đổi loại thanh toán thành text
function getPaymentMethodText(method) {
    const methods = {
        'bank_transfer': 'Chuyển khoản',
        'cash': 'Tiền mặt',
        'cod': 'Thu hộ (COD)'
    };
    return methods[method] || method;
}

// Hàm chuyển đổi loại hàng thành text
function getCargoTypeText(type) {
    const types = {
        'frozen': 'Hàng Đông Lạnh',
        'cool': 'Hàng Mát', 
        'dry': 'Hàng Khô'
    };
    return types[type] || type;
}

// Cập nhật hàm openQR cũ để sử dụng phiếu thu mới
function openQR(index) {
    openReceiptModal(index);
}