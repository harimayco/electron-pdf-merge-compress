const { ipcRenderer, shell } = require("electron");
const PDFMerger = require("pdf-merger-js");
const Swal = require('sweetalert2')

const { appendFileSync } = require("original-fs");

const submit = async (data, compress = false) => {
  let merger = new PDFMerger();
  let { canceled, filePath } = ipcRenderer.sendSync("save");
  if (!canceled) {
    data.forEach((item) => {
      merger.add(item.path);
    });
    await merger.save(`${filePath}.pdf`);
    if(!compress){
      showNotif(`<b>${data.length} telah berhasil di merge & di compress</b><br/>lokasi: ${filePath}.pdf`,  `${filePath}.pdf`);
    }
    return filePath;
  }
  return false;
};

const showNotif = (body, path) => {
  Swal.fire({
    title: `<strong>SUKSES!</strong>`,
    icon: 'success',
    html:body,
    showCloseButton: true,
    focusConfirm: true,
    confirmButtonText:
      'Open File',
  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    if (result.isConfirmed) {
      shell.openPath(path);
    } 
  })
}
const compress = async (data) => {
  let sourcePath = await submit(data, true);
  await ipcRenderer.sendSync('compress', sourcePath);
  showNotif(`<b>${data.length} telah berhasil di merge & di compress</b><br/>lokasi: ${sourcePath}-compressed.pdf`, `${sourcePath}-compressed.pdf`);
  return true;
  }
exports.submit = submit;
exports.compress = compress;
