extends Node3D
class_name S2RBContainerNode3D

const CONTAINER_EXTENTS_M := Vector3(2.0, 2.4, 2.0) # 9.6 m3 in Godot Y-Up space
const ALLOW_CURRENCY_IMPORT := false

@export var world_suns: String = "GAME-SA-006-OPENINDIE2-003-2"
@export var s2_did: String = "DMILES26112688888888IC"

static func s2_meters_to_godot(s2_pt: Vector3) -> Vector3:
    return Vector3(s2_pt.x, s2_pt.z, -s2_pt.y)
