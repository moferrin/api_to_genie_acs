import { Router } from "express";
const router = Router();
const mongoose = require('mongoose');
const axios = require('axios');

const DispositivoModel = mongoose.model('Dispositivo', {
    _id:String,
    wifi:{
        ssid: {
            required:false,
            type: String
            },
        password: {
            required:false,
            type: String
            },
    },
    puertos : {
        required:false,
        type: Array
    },
    lan:{
        required:false,
        type: Object
    }

}, 'equipos');

const serverIP = 'http://192.168.210.7:7557'

router.post("/obtenerDatosReinicio", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;

    const dispositivo = await DispositivoModel.findOne({ _id: id });
    console.log("dispositivo:",dispositivo);
    res.json(dispositivo);
    
});

router.post("/cambiarWifi", async (req, res) => {
    console.log(req.body);
    const id = req.body.id;
    const wifi = req.body.wifi;
 ;

    const url = `${serverIP}/devices/${id}/tasks?connection_request`;

    const data = {
        name: 'setParameterValues',
        parameterValues: [
          ['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID', wifi.ssid, 'xsd:string'],
          ['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase', wifi.password, 'xsd:string']
        ]
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

    const url = `${serverIP}/devices/${id}/tasks?connection_request`;

    //borrado de puertos
    let data = {
        name: 'deleteObject',
        objectName:'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.PortMapping.*'
    };
    await axios.post(url, data);
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
    const lan = req.body.lan;

    const url = `${serverIP}/devices/${id}/tasks?connection_request`;

    const data = {
        name:"setParameterValues",
        parameterValues:[
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

export default router;