FROM registry.gitlab.com/aletrn/my_ghost_writer_base:0.4.0

LABEL authors="trincadev"

# Include global arg in this stage of the build
ARG WORKDIR_ROOT="/var/task"
ENV VIRTUAL_ENV=${WORKDIR_ROOT}/.venv PATH="${WORKDIR_ROOT}/.venv/bin:$PATH"
ENV WRITE_TMP_ON_DISK=""
ENV MOUNT_GRADIO_APP=""
ENV VITE__STATIC_INDEX_URL="/static"
ENV VITE__INDEX_URL="/"
ENV HOME_USER=/home/python

# Set working directory to function root directory
WORKDIR ${WORKDIR_ROOT}
# workaround for missing /home folder
RUN ls -ld ${HOME_USER}
RUN ls -lA ${HOME_USER}

COPY --chown=python:python requirements_poetry.txt pyproject.toml poetry.lock README.md ${WORKDIR_ROOT}/
COPY --chown=python:python ./lite.koboldai.net ${WORKDIR_ROOT}/lite.koboldai.net
COPY --chown=python:python ./my_ghost_writer ${WORKDIR_ROOT}/my_ghost_writer
COPY --chown=python:python ./static ${WORKDIR_ROOT}/static
# RUN . ${WORKDIR_ROOT}/.venv && which python && echo "# install samgis #" && pip install .
RUN if [ "${WRITE_TMP_ON_DISK}" != "" ]; then mkdir {WRITE_TMP_ON_DISK}; fi
RUN if [ "${WRITE_TMP_ON_DISK}" != "" ]; then ls -l {WRITE_TMP_ON_DISK}; fi

RUN ls -l /usr/bin/which
RUN /usr/bin/which python
RUN python --version
RUN pip list
RUN echo "PATH: ${PATH}."
RUN echo "WORKDIR_ROOT: ${WORKDIR_ROOT}."
RUN ls -l ${WORKDIR_ROOT}
RUN ls -ld ${WORKDIR_ROOT}
RUN ls -l ${WORKDIR_ROOT}/
RUN python -c "import sys; print(sys.path)"
RUN python -c "import fastapi"
RUN python -c "import uvicorn"
RUN python -c "import pymongo"
RUN python -c "import requests"
RUN df -h
RUN ls -l ${WORKDIR_ROOT}/my_ghost_writer/app.py
RUN ls -l ${WORKDIR_ROOT}/lite.koboldai.net/index.html

USER 999
EXPOSE 7860

CMD ["uvicorn", "my_ghost_writer.app:app", "--host", "0.0.0.0", "--port", "7860"]
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:7860/health
