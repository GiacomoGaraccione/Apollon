import React, { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Grid, Stack, TextInput, NativeSelect, Textarea, Group, Chip } from "@mantine/core";
import API from "../../../../API";
import { ApollonMode, UMLClassifier, UMLModel } from "../../../../../typings"
import { ApollonEditor } from "../../../../../apollon-editor";
import JSZip from "jszip";
import { Exercise, Solution } from "../../../../Utils/Models";
import { useParams } from "react-router-dom";
import { IconArrowBackUp, IconArrowLeft, IconArrowRight, IconCloudUpload, IconDownload, IconEdit, IconExclamationCircle, IconExclamationCircleFilled, IconSquareRoundedPlusFilled, IconTrash, IconTrashFilled, IconUpload, IconX, IconZoomCheckFilled } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Carousel } from "@mantine/carousel";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";