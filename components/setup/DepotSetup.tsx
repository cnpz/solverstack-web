import React, { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import BubbleMap from "../maps/BubbleMap";
import WorldAtlasJson from "../maps/MapJson";
import * as mapUtils from "../maps/MapUtils";
import * as setupUtils from "./SetupUtils";
import * as mapTypes from "../maps/MapTypes";

// Bootstrap
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FormControl from "react-bootstrap/FormControl";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

const axios = require('axios');


const svgHeight: number = 350;

const DepotSetup = () => {
    /**
     * Setup page for geocode module. 
     * 
     * Requires users to input csv file containing
     * zipcodes and country abbreviations.
     */
    const atlasJson = WorldAtlasJson();
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [svgWidth, setSvgWidth] = useState<any>(null);
    const [fileName, setFileName] = useState("destinations file");
    const [csvUrl, setCsvUrl] = useState<string>("");
    const [origins, setOrigins] = useState<Array<mapTypes.CoordinateMarker>>(Array<mapTypes.CoordinateMarker>(0));
    const [destinations, setDestinations] = useState<Array<mapTypes.CoordinateMarker>>(Array<mapTypes.CoordinateMarker>(0));

    const handleSvgWidth = () => {
        /**
         * Get current width of div containing rendered SVG and 
         * set svg width state.
         */
        if (!svgContainerRef) {
            return;
        }
        
        if (svgContainerRef.current) {
            setSvgWidth(svgContainerRef.current.offsetWidth);
        }
    }

    const onFileUpdate = event => {
        /**
         * Event handler for file input.
         */
        setFileName(event.target.value.split("\\").splice(-1)[0]);

        Papa.parse(event.target.files[0], {
            header: true,
            complete: function(results) {
                let parsedDestinations = Array<mapTypes.CoordinateMarker>(results.data.length);

                for (var i = 0; i < results.data.length; i++) {
                    parsedDestinations[i] = {
                        latitude: parseFloat(results.data[i].latitude),
                        longitude: parseFloat(results.data[i].longitude)
                    };
                }

                setDestinations(parsedDestinations);

                axios.post(
                    process.env.dev.DEPOT_SERVICE_URL,
                    {stack_id: 2, nodes: results.data} // NOTE: for MVP stack_id is hardcoded
                    ).then(function (response) {
                        
                        setOrigins(response.data.depots);

                        const csv = Papa.unparse(response.data.depots);
                        const csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
                        const csvUrl = window.URL.createObjectURL(csvData);
            
                        setCsvUrl(csvUrl);
                    }).catch(function (error) {
                        console.log(error);
                        return error;
                    });
            }
        });
    };

    useEffect(() => {
        window.addEventListener("load", handleSvgWidth);
        window.addEventListener("resize", handleSvgWidth);
    }, []);


    return (
        
        <Card>
            <Card.Header><h4>Depot</h4></Card.Header>
            <Card.Body>
                <Form>
                    <Row className="mb-4">
                        <Col className="p-0">
                            <div 
                            className="svg-container"
                            ref={svgContainerRef}>
                                <BubbleMap 
                                height={svgHeight}
                                width={svgWidth}
                                atlasJson={atlasJson}
                                origins={origins}
                                destinations={destinations} />
                            </div>
                        </Col>
                    </Row>
                    <Row className="d-flex justify-content-end">
                        {destinations.length > 0 &&
                            <a href={csvUrl}><Button className="download-btn">Download</Button></a>
                        }
                        <Col lg="8">
                            <Form.File 
                            id="custom-file" 
                            label={fileName} 
                            custom onChange={onFileUpdate} />
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default DepotSetup;
