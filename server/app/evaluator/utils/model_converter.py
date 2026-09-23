def is_v2_model(model):
    if model.get("version", "").startswith("2"):
        return True
    if isinstance(model.get("elements"), list):
        return True
    return False


def convert_v2_to_v3(model):
    converted = {
        "version": "3.0.0",
        "type": model.get("type", "ClassDiagram"),
        "size": model.get("size", {"width": 1000, "height": 800}),
        "interactive": {"elements": {}, "relationships": {}},
        "elements": {},
        "relationships": {},
        "assessments": {}
    }

    for element in model.get("elements", []):
        eid = element.get("id")
        if not eid:
            continue
        new_el = {
            "id": eid,
            "name": element.get("name", ""),
            "type": element.get("type", ""),
            "owner": element.get("owner"),
            "bounds": element.get("bounds", {}),
        }
        if "attributes" in element:
            new_el["attributes"] = element["attributes"]
        if "methods" in element:
            new_el["methods"] = element["methods"]
        if "strokeColor" not in new_el:
            new_el["strokeColor"] = "#000000"
        if "textColor" not in new_el:
            new_el["textColor"] = "#000000"
        if element.get("type") != "UseCaseActor":
            if "fillColor" not in new_el:
                new_el["fillColor"] = "#FFFFFF"
        converted["elements"][eid] = new_el

    for rel in model.get("relationships", []):
        rid = rel.get("id")
        if not rid:
            continue
        new_rel = {
            "id": rid,
            "name": rel.get("name", ""),
            "type": rel.get("type", ""),
            "owner": rel.get("owner"),
            "bounds": rel.get("bounds", {}),
            "path": rel.get("path", []),
            "source": rel.get("source", {}),
            "target": rel.get("target", {}),
            "isManuallyLayouted": rel.get("isManuallyLayouted", False),
        }
        if "strokeColor" not in new_rel:
            new_rel["strokeColor"] = "#000000"
        if "textColor" not in new_rel:
            new_rel["textColor"] = "#000000"
        converted["relationships"][rid] = new_rel

    return converted


def ensure_v3(model):
    if is_v2_model(model):
        return convert_v2_to_v3(model)
    return model
