export type PocketParams = {
    favorite: number,
    count: number,
    sort: string,
    detailType: string,
}


  export type ModifiedDataTypes = {
    item_id: string;
    given_url: string;
    resolved_title: string;
    excerpt: string;
    time_favorited: number;
    time_to_read: number;
    word_count?: number;
    tags?: object[];
  };

  export interface DataTypes {
    id: string;
    url: string;
    title: string;
    description: string;
    time_added: string;
    read_time: number;
    word_count: string;
    tags: { [tagName: string]: Tag };
  }
  
  interface Tag {
    item_id: string;
    tag: string;
  }

  export type PocketPostType = {
    id: string;
    url: string;
    title: string;
    description: string;
    time_added: number;
    read_time: number;
    word_count?: number;
    tags?: object[];
  };
  
  interface Template extends PocketPostType {
    data: PocketPostType<>;
  }

  interface TagPost {
    tag: {
      item_id: string;
      tag: string;
    };
  }
  
  
  
  
  
  
  