#!/usr/bin/env python3
"""
Octave REST microservice.
PHP backend calls this internally – never exposed to the public internet.
"""

import subprocess
import json
import os
import time
import threading
from flask import Flask, request, jsonify

app = Flask(__name__)

sessions = {}
sessions_lock = threading.Lock()

SLOWDOWN_FACTOR = float(os.environ.get("OCTAVE_SLOWDOWN", "0"))  # seconds extra delay


def run_octave(commands: list[str]) -> dict:
    #Run a list of Octave commands and return stdout/stderr
    script = "\n".join(commands) + "\n"
    try:
        result = subprocess.run(
            ["octave", "--no-gui", "--norc", "--eval", script],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if SLOWDOWN_FACTOR > 0:
            time.sleep(SLOWDOWN_FACTOR)
        return {
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Timeout after 30s", "returncode": -1}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -1}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/eval", methods=["POST"])
def eval_command():
    data = request.get_json(force=True)
    session_id = data.get("session_id", "default")
    command = data.get("command", "").strip()

    if not command:
        return jsonify({"error": "No command provided"}), 400

    with sessions_lock:
        session_vars = sessions.get(session_id, {})

    preamble = []
    for var, val in session_vars.items():
        preamble.append(f"{var} = {val};")

    commands = preamble + [command]
    out = run_octave(commands)

    if out["returncode"] == 0:
        for line in command.split("\n"):
            line = line.strip().rstrip(";")
            if "=" in line and not line.startswith("%"):
                var_part = line.split("=")[0].strip()
                expr_part = "=".join(line.split("=")[1:]).strip()
                if var_part.isidentifier():
                    with sessions_lock:
                        if session_id not in sessions:
                            sessions[session_id] = {}
                        sessions[session_id][var_part] = expr_part

    return jsonify({
        "session_id": session_id,
        "command": command,
        "stdout": out["stdout"],
        "stderr": out["stderr"],
        "success": out["returncode"] == 0,
    })


@app.route("/simulate/pendulum", methods=["POST"])
def simulate_pendulum():
    #Run the inverted pendulum simulation.

    data = request.get_json(force=True)
    r = float(data.get("r", 0.2))
    init_pos = float(data.get("init_position", 0))
    init_angle = float(data.get("init_angle", 0))
    t_end = float(data.get("t_end", 10))

    script = f"""
pkg load control
M = .5; m = 0.2; b = 0.1; I = 0.006; g = 9.8; l = 0.3;
p = I*(M+m)+M*m*l^2;
A = [0 1 0 0; 0 -(I+m*l^2)*b/p (m^2*g*l^2)/p 0; 0 0 0 1; 0 -(m*l*b)/p m*g*l*(M+m)/p 0];
B = [ 0; (I+m*l^2)/p; 0; m*l/p];
C = [1 0 0 0; 0 0 1 0];
D = [0; 0];
K = lqr(A,B,C'*C,1);
Ac = (A-B*K);
N = -inv(C(1,:)*inv(A-B*K)*B);
sys = ss(Ac,B*N,C,D);
t = 0:0.05:{t_end};
r = {r};
[y,t,x] = lsim(sys, r*ones(size(t)), t, [{init_pos};0;{init_angle};0]);
t_str = sprintf('%.4f,', t); t_str = t_str(1:end-1);
y1_str = sprintf('%.6f,', y(:,1)); y1_str = y1_str(1:end-1);
y2_str = sprintf('%.6f,', y(:,2)); y2_str = y2_str(1:end-1);
x_last = x(end,:);
printf('T:%s\\nY1:%s\\nY2:%s\\nXLAST:%.6f,%.6f,%.6f,%.6f\\n', t_str, y1_str, y2_str, x_last(1), x_last(2), x_last(3), x_last(4));
"""
    out = run_octave([script])
    if out["returncode"] != 0:
        return jsonify({"error": out["stderr"]}), 500

    lines = {}
    for line in out["stdout"].split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            lines[key] = val

    def parse_floats(s):
        return [float(x) for x in s.split(",") if x.strip()]

    return jsonify({
        "t": parse_floats(lines.get("T", "")),
        "position": parse_floats(lines.get("Y1", "")),
        "angle": parse_floats(lines.get("Y2", "")),
        "x_last": parse_floats(lines.get("XLAST", "")),
        "success": True,
    })


@app.route("/simulate/ball_beam", methods=["POST"])
def simulate_ball_beam():
    #Run the ball-on-beam simulation.

    data = request.get_json(force=True)
    r = float(data.get("r", 0.25))
    init_speed = float(data.get("init_speed", 0))
    init_accel = float(data.get("init_accel", 0))
    t_end = float(data.get("t_end", 5))

    script = f"""
pkg load control
m = 0.111; R = 0.015; g = -9.8; J = 9.99e-6;
H = -m*g/(J/(R^2)+m);
A = [0 1 0 0; 0 0 H 0; 0 0 0 1; 0 0 0 0];
B = [0;0;0;1];
C = [1 0 0 0];
D = [0];
K = place(A,B,[-2+2i,-2-2i,-20,-80]);
N = -inv(C*inv(A-B*K)*B);
sys = ss(A-B*K,B,C,D);
t = 0:0.01:{t_end};
r = {r};
[y,t,x] = lsim(N*sys, r*ones(size(t)), t, [{init_speed};0;{init_accel};0]);
beam_angle = x(:,3);
t_str = sprintf('%.4f,', t); t_str = t_str(1:end-1);
y_str = sprintf('%.6f,', y); y_str = y_str(1:end-1);
ang_str = sprintf('%.6f,', beam_angle); ang_str = ang_str(1:end-1);
x_last = x(end,:);
printf('T:%s\\nY:%s\\nANG:%s\\nXLAST:%.6f,%.6f,%.6f,%.6f\\n', t_str, y_str, ang_str, x_last(1), x_last(2), x_last(3), x_last(4));
"""
    out = run_octave([script])
    if out["returncode"] != 0:
        return jsonify({"error": out["stderr"]}), 500

    lines = {}
    for line in out["stdout"].split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            lines[key] = val

    def parse_floats(s):
        return [float(x) for x in s.split(",") if x.strip()]

    return jsonify({
        "t": parse_floats(lines.get("T", "")),
        "ball_position": parse_floats(lines.get("Y", "")),
        "beam_angle": parse_floats(lines.get("ANG", "")),
        "x_last": parse_floats(lines.get("XLAST", "")),
        "success": True,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
