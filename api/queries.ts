import { gql } from '@apollo/client/core';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      displayName
      email
      avatarUrl
      createdAt
      disabled
      metadata
      emailVerified
    }
  }
`;

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: citext = "") {
    users(where: { email: { _eq: $email } }) {
      id
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: uuid = "") {
    deleteUser(id: $id) {
      id
    }
  }
`;
export const GET_CONNECTIONS = gql`
  query GetConnections($project_id: uuid = "") {
    connections(where: { project_id: { _eq: $project_id } }) {
      id
      name
      created_at
    }
  }
`;
export const CREATE_CONNECTION = gql`
  mutation CreateConnection(
    $name: String = ""
    $description: String = ""
    $configuration: json = {}
    $project_id: uuid = ""
  ) {
    insert_connections_one(
      object: {
        configuration: $configuration
        description: $description
        name: $name
        project_id: $project_id
      }
    ) {
      id
    }
  }
`;
export const DELETE_CONNECTION = gql`
  mutation DeleteConnection($id: uuid = "") {
    delete_connections_by_pk(id: $id) {
      id
    }
  }
`;
export const GET_WORKSPACES = gql`
  query GetWorkspacesByWorkspaceAccess(
    $user_id: uuid = ""
    $project_id: uuid = ""
  ) {
    workspace_access(
      where: {
        receiver_id: { _eq: $user_id }
        workspace_access_workspaces: { project_id: { _eq: $project_id } }
      }
    ) {
      id
      access_level
      workspace_access_workspaces {
        id
        created_at
        name
      }
    }
  }
`;
export const GET_WORKSPACE_INFO = gql`
  query GetWorkspaceInfo($id: uuid = "") {
    workspaces_by_pk(id: $id) {
      name
    }
  }
`;
export const GET_WORKSPACE = gql`
  query GetWorkspace($id: uuid = "") {
    workspaces_by_pk(id: $id) {
      id
      name
      tabs
      commands
    }
  }
`;

export const GET_WORKSPACE_WITH_ACCESS = gql`
  query GetWorkspaceWithAccess(
    $user_id: uuid = ""
    $id: uuid = ""
  ) {
    workspace_access(
      where: {
        receiver_id: { _eq: $user_id }
        workspace_id: { _eq: $id }
      }
    ) {
      id
      access_level
      workspace_access_workspaces {
        id
        name
        tabs
        commands
      }
    }
  }
`;

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace(
    $receiver_id: uuid = ""
    $sender_id: uuid = ""
    $name: String = ""
    $description: String = ""
    $project_id: uuid = ""
  ) {
    insert_workspaces_one(
      object: {
        workspaces_workspace_access: {
          data: {
            access_level: "Owner"
            is_accepted: true
            receiver_id: $receiver_id
            sender_id: $sender_id
          }
        }
        description: $description
        name: $name
        project_id: $project_id
      }
    ) {
      id
    }
  }
`;
export const UPDATE_WORKSPACE_INFO = gql`
  mutation UpdateWorkspaceInfo($id: uuid = "", $name: String = "") {
    update_workspaces_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      id
    }
  }
`;
export const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: uuid = "") {
    delete_workspaces_by_pk(id: $id) {
      id
    }
  }
`;
export const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($id: uuid = "", $tabs: json!, $commands: json!) {
    update_workspaces_by_pk(
      pk_columns: { id: $id }
      _set: { tabs: $tabs, commands: $commands }
    ) {
      id
    }
  }
`;
export const GET_PROJECTS = gql`
  query GetProjects($userId: uuid = "") {
    projects(
      where: {
        _or: [
          { user_id: { _eq: $userId } }
          {
            projects_workspaces: {
              workspaces_workspace_access: { receiver_id: { _eq: $userId } }
            }
          }
        ]
      }
    ) {
      name
      id
      created_at
    }
  }
`;
export const GET_PROJECT = gql`
  query GetProject($id: uuid = "") {
    projects_by_pk(id: $id) {
      name
      id
    }
  }
`;
export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $description: String = ""
    $name: String = ""
    $user_id: uuid = ""
  ) {
    insert_projects_one(
      object: { description: $description, name: $name, user_id: $user_id }
    ) {
      id
      created_at
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: uuid = "", $name: String = "") {
    update_projects_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      id
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: uuid = "") {
    delete_projects_by_pk(id: $id) {
      id
    }
  }
`;

export const GET_WORKSPACE_ACCESSES = gql`
  query GetAccesses($workspaceId: uuid = "") {
    workspace_access(where: { workspace_id: { _eq: $workspaceId } }) {
      access_level
      id
      is_accepted
      workspace_access_user {
        id
        email
        metadata
      }
      sender_id
    }
  }
`;

export const GET_WORKSPACE_ACCESS_BY_USER_ID = gql`
  query GetWorkspaceAccessByUserId($userId: uuid = "") {
    workspace_access(where: { receiver_id: { _eq: $userId } }) {
      id
      access_level
      is_accepted
      receiver_id
      sender_id
      workspace_id
    }
  }
`;

export const CREATE_WORKSPACE_ACCESS = gql`
  mutation InsertWorkspaceAccess(
    $accessLevel: String = ""
    $isAccepted: Boolean = false
    $receiverId: uuid = ""
    $senderId: uuid = ""
    $workspaceId: uuid = ""
  ) {
    insert_workspace_access_one(
      object: {
        access_level: $accessLevel
        is_accepted: $isAccepted
        receiver_id: $receiverId
        sender_id: $senderId
        workspace_id: $workspaceId
      }
    ) {
      id
    }
  }
`;

export const DELETE_WORKSPACE_ACCESS = gql`
  mutation DeleteWorkspaceAccess($id: uuid = "") {
    delete_workspace_access_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_WORKSPACE_ACCESS = gql`
  mutation UpdateAccess(
    $id: uuid = ""
    $accessLevel: String = ""
    $isAccepted: Boolean = false
    $receiverId: uuid = ""
    $senderId: uuid = ""
    $workspaceId: uuid = ""
  ) {
    update_workspace_access_by_pk(
      pk_columns: { id: $id }
      _set: {
        access_level: $accessLevel
        is_accepted: $isAccepted
        receiver_id: $receiverId
        sender_id: $senderId
        workspace_id: $workspaceId
      }
    ) {
      access_level
      id
    }
  }
`;
