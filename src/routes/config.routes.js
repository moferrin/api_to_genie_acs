import { Router } from "express";
import { authRequired } from '../middlewares/validateToken.js';

const router = Router();
const mongoose = require('mongoose');
const axios = require('axios');

const DispositivoSchema = new mongoose.Schema({
    _id: String,
    puertoPON: String,
    marca: String,
    modelo: String,
    ipWAN: String,
    cedulaRUC: {
        type: String,
        default: ''
    },
    wifi: {
        ssid: {
            type: String,
            required: false
        },
        password: {
            type: String,
            required: false
        },
        enabled: {
            type: Boolean,
            required: false
        }
    },
    puertos: {
        type: Array,
        required: false
    },
    lan: {
        type: Object,
        required: false
    }
}, {
    timestamps: true,
    collection: 'equipos' // nombre de la colección en MongoDB
});

const DispositivoModel = mongoose.model('Dispositivo', DispositivoSchema);

const serverIP = 'http://192.168.210.7:7557';

const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

router.get("/listar", async (req, res) => {

    const url = `${serverIP}/devices`;
    const response = await axios.get(url);

    const devices = response.data.map(device => {
        // Inicializar WANDevice como null
        let ipWAN = null;
        // Buscar en WANConnectionDevice desde '1' hasta '8'
        for (let i = 1; i <= 8; i++) {
            // Verificar si el objeto y la propiedad deseada existen
            if (device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i] &&
                device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'] &&
                device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'].ExternalIPAddress['_value']) {
                // Asignar el valor de ExternalIPAddress a WANDevice
                ipWAN = device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'].ExternalIPAddress['_value'];
                // Salir del bucle una vez que se encuentra el dato
                break;
            }
        }
        // Devolver el objeto con la propiedad WANDevice solo si se encontró un valor
        return {
            _id: device._id,
            marca: device._deviceId._Manufacturer,
            ipWAN, // Esto será null si no se encontró ningún valor
            modelo: device._deviceId._ProductClass,
            puertoPON: device._deviceId._SerialNumber,
        };
    });

    return res.json(devices);
});

router.post("/listarById", async (req, res) => {

    const id = req.body.id;
    //validar que exista el campo
    if (!id) {
        return res.status(400).json({
            message: "Debe enviar el id del dispositivo"
        });
    }

    const url = `${serverIP}/devices/?query={"_id": "${id}"}`;
    const response = await axios.get(url);

    const devices = response.data.map(device => {
        // Inicializar WANDevice como null
        let _WANDevice = null;
        // Buscar en WANConnectionDevice desde '1' hasta '8'
        for (let i = 1; i <= 8; i++) {
            // Verificar si el objeto y la propiedad deseada existen
            if (device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i] &&
                device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'] &&
                device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'].ExternalIPAddress['_value']) {
                // Asignar el valor de ExternalIPAddress a WANDevice
                _WANDevice = device.InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANIPConnection['1'].ExternalIPAddress['_value'];
                // Salir del bucle una vez que se encuentra el dato
                break;
            }
        }
        // Devolver el objeto con la propiedad WANDevice solo si se encontró un valor
        return {
            _id: device._id,
            _Manufacturer: device._deviceId._Manufacturer,
            _WANDevice, // Esto será null si no se encontró ningún valor
            _ProductClass: device._deviceId._ProductClass,
            _SerialNumber: device._deviceId._SerialNumber,
        };
    });

    return res.json(devices);
});

router.get("/listarByUser", authRequired, async (req, res) => {
    let cedulaRUC = req.cedulaRUC;
    console.log(cedulaRUC)
    //validar que exista el campo
    if (!cedulaRUC) {
        return res.status(400).json({
            message: "Debe enviar cedula o ruc"
        });
    }
    let dispositivo = {};
    // console.log(req.rol)
    if(req.isAdmin == true)
        dispositivo = await DispositivoModel.find();
    else
        dispositivo = await DispositivoModel.find({cedulaRUC});

    res.json(dispositivo);
});

router.post("/obtenerDatosPanel", async (req, res) => {
    const id = req.body.id;
    //validar que exista el campo
    if (!id) {
        return res.status(400).json({
            message: "Debe enviar el id del dispositivo"
        });
    }
    const dispositivo = await DispositivoModel.findOne({ _id: id });
    console.log("dispositivo:",dispositivo);
    res.json(dispositivo);

});

router.post("/obtenerDatosReinicio", async (req, res) => {
    const id = req.body.id;
    if (!id) {
        return res.status(400).json({
            message: "Debe enviar el id del dispositivo"
        });
    }
    console.log('Reinicio de:' + id);

    const dispositivo = await DispositivoModel.findOne({ _id: id });
    console.log("dispositivo:",dispositivo);
    res.json(dispositivo);

});

router.post("/cambiarWifi", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;
    const wifi = req.body.wifi;

    if (!id) {
        return res.status(400).json({
            message: "Debe enviar el id del dispositivo"
        });
    }

    if (!wifi) {
        return res.status(400).json({
            message: "Debe enviar datos wifi del dispositivo"
        });
    }

    //validar campo ssid, y password
    if ((!wifi.ssid ||!wifi.password) && (wifi.enabled == true)) {
        return res.status(400).json({
            message: "Enviar credentiales"
        });
    }

    const dispositivo = await DispositivoModel.findOne({ _id: id });
    console.log("dispositivo:",dispositivo);

    if (!dispositivo) {
        return res.status(400).json({
            message: "Dispositivo no encontrado"
        });
    }

    const url = `${serverIP}/devices/${id}/tasks?timeout=3000&connection_request`;

    let parameterValues = [];

    parameterValues.push(['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable', wifi.enabled, 'xsd:boolean']);
    parameterValues.push(['InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.Enable', wifi.enabled, 'xsd:boolean']);

    //si tiene wifi activado, puedo mandar a poner ssid
    if(wifi.enabled){
        parameterValues.push(['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID', wifi.ssid, 'xsd:string']);
        parameterValues.push(['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase', wifi.password, 'xsd:string']);

        //si tiene 5G
        if(true){
            parameterValues.push(['InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.SSID', wifi.ssid+" 5G", 'xsd:string']);
            parameterValues.push(['InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.PreSharedKey.1.KeyPassphrase', wifi.password, 'xsd:string']);      
        }
    }

    const data = {
        name: 'setParameterValues',
        parameterValues: parameterValues
    };

    await axios.post(url, data)
    .then(async response => {
        console.log('Respuesta del servidor:');
        console.log(response.data);
        //actualizar en mongo
        await DispositivoModel.findOneAndUpdate({ _id: id },{wifi},{ new: true, upsert: true });
        res.json({message: "Contraseña actualizada correctamente"});
    })
    .catch(error => {
        console.error('Error al realizar la solicitud:');
        console.error(error);
        res.status(500).json({message:"Error al realizar la solicitud"});
    });
});

router.post("/cambiarMapeoPuertos", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;
    const puertos = req.body.puertos;

    let validacion = validarPuertos(puertos);
    if(validacion){
        return res.status(400).json(validacion);
    }

    const url = `${serverIP}/devices/${id}/tasks?timeout=3000&connection_request`;

    //borrado de puertos
    let data = {
        name: 'deleteObject',
        objectName:'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.*'
    };
    await axios.post(url, data)
    .then(async response => {
        //console.log('Respuesta del servidor:');
        //console.log(response.data)
    })
    .catch(err => {
        console.error('Error al realizar la solicitud:');
        console.error(err);
        return res.status(500).json({message:"Error al realizar la solicitud"});
    });

    console.log("Borrado de puertos OK");

    //creacion de puertos
    for (let i = 0; i < puertos.length; i++){
        //creo un objeto
        data = {
            name: 'addObject',
            objectName:'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping',
        }
        await axios.post(url, data);

        //mando a agredarles los puertos

        let interno = puertos[i].interno;
        let externo = puertos[i].externo;
        let ipHost = puertos[i].ipHost;
        let nombre = puertos[i].nombre;

        let j = i+1;

        data = {
            name: 'setParameterValues',
            parameterValues:[
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.InternalClient`, ipHost, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.PortMappingDescription`, nombre, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.InternalPort`, interno, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.ExternalPort`, externo, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.ExternalPortEndRange`, externo, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.X_HW_Portlist.1.ExternalPort`, `${interno}:${externo}`, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.X_HW_Portlist.1.InternalPort`, `${interno}:${externo}`, "xsd:string"],
                [`InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.${j}.PortMappingEnabled`, true]
              ]
        }
        await axios.post(url, data)
        .then(async response => {
            //console.log('Respuesta del servidor:');
            //console.log(response.data)
        })
        .catch(err => {
            console.error('Error al realizar la solicitud:');
            console.error(err);
            res.status(500).json({message:"Error al realizar la solicitud"});
        });
    }

    //mandar a actualizar en mongo
    await DispositivoModel.findOneAndUpdate({ _id: id },{puertos},{ new: true, upsert: true });

    res.json({message: "Puertos actualizados correctamente"});

});

router.post("/cambiarLan", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;
    let lan = req.body.lan;

    if (!id) {
        return res.status(400).json({
            message: "Debe enviar el id del dispositivo"
        });
    }
    if (!lan) {
        return res.status(400).json({
            message: "Debe enviar datos lan del dispositivo"
        });
    }

    lan = {
        ipLAN: lan.ipLAN.trim(),
        mascara: lan.mascara.trim(),
        ipMin: lan.ipMin.trim(),
        ipMax: lan.ipMax.trim(),
        dns: lan.dns.trim(),
    }

    //verificar que mascara, ipMin, ipMax sean tipo ip y no otro tipo de dato
    if (!regex.test(lan.mascara) ||!regex.test(lan.ipMin) ||!regex.test(lan.ipMax)) {
        return res.status(400).json({
            message: "Valide que sus datos sean correctos"
        });
    }

    let dns = lan.dns.split(',');
    if (dns.length > 2) {
        return res.status(400).json({
            message: "Máximo 2 dns"
        });
    }

    for (let i = 0; i < dns.length; i++) {
        dns[i] = dns[i].trim();
        if (!regex.test(dns[i])) {
            return res.status(400).json({
                message: "Valide que sus datos sean correctos"
            });
        }
    }


    const url = `${serverIP}/devices/${id}/tasks?timeout=3000&connection_request`;

    const data = {
        name:"setParameterValues",
        parameterValues:[
            [`InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress`, lan.ipLAN, "xsd:string"],
            [`InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceSubnetMask`, lan.mascara, "xsd:string"],
            [`InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MinAddress`, lan.ipMin, "xsd:string"],
            [`InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MaxAddress`, lan.ipMax, "xsd:string"],
            [`InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers`, lan.dns, "xsd:string"]
        ]
    }

    await axios.post(url, data)
    .then(async response => {
        console.log('Respuesta del servidor:');
        console.log(response.data);
        //actualizar en mongo
        await DispositivoModel.findOneAndUpdate({ _id: id },{lan},{ new: true, upsert: true });
        res.json({message: "Lan actualizada correctamente"});
    })
    .catch(error => {
        console.error('Error al realizar la solicitud:');
        console.error(error);
        res.status(500).json({message:"Error al realizar la solicitud"});
    });
});

router.post("/guardarDatos", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;
    const puertoPON = req.body.puertoPON;

    

    let cedulaRUC = "2300720576";

    await axios.post('https://power.net.ec/app/rest_powernet/web-services/get_user_portpon.php',
        {
            port_pon: puertoPON
        },
        {
            headers: {
                'Authorization': 'Bearer 0baa30c656b407c1bda1270dca777eed'  // Aquí se añade el token Bearer
            }
        }
    ).then(async response => {
        console.log('Respuesta del servidor:');
        let respuesta  = response.data;

        console.log(respuesta);
        console.log(respuesta.data);

        if(respuesta.success == 'OK'){
            cedulaRUC = respuesta.data.user_ci;
        } else {
            console.error('Error al obtener cedula RUC para: ' + puertoPON);
        }
    })
    .catch(error => {
        console.log(error);
        console.error('Error al realizar la solicitud para:' + puertoPON);
    });

    //mandar a guardar en la base de datos si no existe
    const dispositivo = new DispositivoModel({
        _id: req.body.id,
        wifi: req.body.wifi,
        puertos: req.body.puertos,
        lan: req.body.lan,
        puertoPON: req.body.puertoPON,
        marca: req.body.marca,
        modelo: req.body.modelo,
        ipWAN: req.body.ipWAN,
        cedulaRUC: cedulaRUC
    });

    await DispositivoModel.findOneAndUpdate({_id: id},{ $set: dispositivo },{new: true, upsert: true});

    res.json({message: "Datos guardados correctamente"});
});

router.post("/eliminar", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;
    console.log('Eliminar:'+ id)

    const url = `${serverIP}/devices/${id}`;

    await axios.delete(url)
    .then(async response => {
        console.log('Respuesta del servidor:');
        console.log(response.data);
        await DispositivoModel.findByIdAndDelete({_id: id});
        res.json({message: "Dispositivo eliminado correctamente"});
    })
    .catch(error => {
        console.error('Error al realizar la solicitud:');
        console.error(error);
        res.status(500).json({message:"Error al realizar la solicitud"});
    });
});

router.put('/asociar', async (req, res) => {
    const {cedulaRUC, puertoPON} = req.body;
    if (!cedulaRUC) {
        return res.status(400).json({
            message: "Debe enviar la cedula o ruc"
        });
    }
    if(!puertoPON){
        return res.status(400).json({
            message: "Debe enviar el puerto pon"
        });
    }
    //mandar a actualizar en mongo
    await DispositivoModel.findOneAndUpdate({puertoPON},{cedulaRUC},{ new: true, upsert: true });
    res.json({message: "Dispositivo asociado correctamente"});
})

router.post('/resetear', async (req, res) => {
    const {id} = req.body;
    if (!id) {
        return res.status(400).json({
            message: "Debe enviar el id del dispositivo"
        });
    }
    const url = `${serverIP}/devices/${id}/tasks?timeout=3000&connection_request`;

    const data = {
        name:"factoryReset"
    }

    await axios.post(url, data)
    .then(async response => {
        console.log('Respuesta del servidor:');
        console.log(response.data);
        res.json({message: "Reseteado correctamente"});
    })
    .catch(error => {
        console.error('Error al realizar la solicitud:');
        console.error(error);
        res.status(500).json({message:"Error al realizar la solicitud"});
    });
})

// router.get('/test', async (req, res) => {
//     let cedulaRUC
//     await axios.post('https://power.net.ec/app/rest_powernet/web-services/get_user_portpon.php',{
//         port_pon: '4857544389A6399B'
//     }).then(async response => {
//         console.log('Respuesta del servidor:');
//         console.log(response.data);
//         //actualizar en mongo
//         cedulaRUC = "2300720576"
//     })
//     .catch(error => {
//         console.error('Error al realizar la solicitud:');
//         ///console.error(error);
//         cedulaRUC = "23007205760001"
//     });
// })

function validarPuertos (puertos) {
    for (let i = 0; i < puertos.length; i++){
        let element = puertos[i];
        //validar el campo interno y externo sean numeros
        if (!element.interno ||!element.externo) {
            return {
                message: "Ingrese los puertos internos y externos"
            };
        }

        if (isNaN(element.interno) || isNaN(element.externo)) {
            return {
                message: "Ingrese los puertos internos y externos como numeros"
            };
        }
        //validar ipHost
        if (!element.ipHost) {
            return {
                message: "Ingrese la ip del host"
            };
        }

        element.ipHost = element.ipHost.trim();
        if (!regex.test(element.ipHost)) {
            return {
                message: "Ingrese una ip valida"
            };
        }

        //validar nombre
        if (!element.nombre) {
            return {
                message: "Ingrese descripcion (Nombre)"
            };
        }
    };
}

export default router;