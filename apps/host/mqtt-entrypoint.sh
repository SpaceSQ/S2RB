#!/bin/sh
set -eu
mkdir -p /mosquitto/config /mosquitto/data
cp /config/mosquitto.conf /mosquitto/config/mosquitto.conf
cp /config/acl /mosquitto/config/acl
USER="${S2_MQTT_USER:-s2rb}"
PASS="${S2_MQTT_PASSWORD:-s2rb-local}"
sed "s/^user s2rb$/user ${USER}/" /config/acl > /mosquitto/config/acl
mosquitto_passwd -b -c /mosquitto/config/passwd "$USER" "$PASS"
exec mosquitto -c /mosquitto/config/mosquitto.conf
